/**
 * labService.js (server) — Backend laboratory business logic
 *
 * MEDICAL AUTHORITY SEPARATION:
 *   Brain output     → clinicalNotes / risk assessment (not a diagnosis)
 *   Vet assessment   → vetAssessment (veterinary clinical findings)
 *   Lab result       → LabResult.resultOutcome (laboratory test result)
 *
 * These are three DISTINCT concepts. This service does NOT:
 *   - Generate lab results from Brain output
 *   - Auto-confirm disease from risk level
 *   - Allow result status to be set by the client
 *
 * CASE TRANSITION RULES (server-enforced):
 *   LAB_PENDING + POSITIVE     → CONFIRMED
 *   LAB_PENDING + NEGATIVE     → REJECTED
 *   LAB_PENDING + INCONCLUSIVE → no automatic transition (vet review required)
 *   Any other case status      → no transition (result recorded; case unchanged)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Order Number / Sample Code Generation
// Format: LAB-YYYY-NNN / SMP-YYYY-NNN
// NOTE: For demo scale only — production would use DB sequences for atomicity
// ─────────────────────────────────────────────────────────────────────────────

async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.labOrder.count({
    where: { orderNumber: { startsWith: `LAB-${year}-` } }
  });
  const seq = String(count + 1).padStart(3, '0');
  return `LAB-${year}-${seq}`;
}

async function generateSampleCode() {
  const year = new Date().getFullYear();
  const count = await prisma.labSample.count({
    where: { sampleCode: { startsWith: `SMP-${year}-` } }
  });
  const seq = String(count + 1).padStart(3, '0');
  return `SMP-${year}-${seq}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Scope — Prisma where clause by authenticated role
// ─────────────────────────────────────────────────────────────────────────────

function getLabOrderScope(user) {
  switch (user.role) {
    case 'FARMER':
      // Can only see orders linked to cases for their own animals
      return {
        case: {
          farm: { ownerId: user.userId }
        }
      };
    case 'VETERINARIAN':
      // Can see orders for cases assigned to them
      return {
        OR: [
          { requestorId: user.userId },
          { case: { assignedVetId: user.userId } }
        ]
      };
    case 'DISTRICT_OFFICIAL':
      // Can see orders in their district — via case → farm → district
      return {};  // district-scoping requires district association on user; broad for now
    case 'STATE_OFFICIAL':
    case 'ADMIN':
      return {};  // Full access
    default:
      return { id: 'NEVER' };  // Deny unknown roles
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-resource authorization checks
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthorizedLabOrder(orderId, user) {
  const scope = getLabOrderScope(user);
  return prisma.labOrder.findFirst({
    where: { id: orderId, ...scope },
    include: {
      case:       { include: { animal: { include: { species: true } }, farm: { include: { district: true } } } },
      labFacility: { select: { id: true, name: true, code: true, accredited: true, district: true } },
      requestor:  { select: { id: true, fullName: true, username: true } },
      suspectedDisease: { select: { id: true, name: true, shortName: true } },
      samples: {
        include: {
          sampleType: { select: { id: true, name: true } },
          tests: {
            include: {
              diagnosticMethod: { select: { id: true, name: true, code: true, type: true } },
              results: true,
            }
          }
        }
      }
    }
  });
}

async function getAuthorizedLabTest(testId, user) {
  // Walk up: LabTest → LabSample → LabOrder → Case
  const test = await prisma.labTest.findUnique({
    where: { id: testId },
    include: {
      sample: {
        include: {
          labOrder: {
            include: {
              case: {
                include: {
                  farm: true,
                  assignedVet: true,
                }
              }
            }
          }
        }
      },
      diagnosticMethod: true,
      results: true,
    }
  });
  if (!test) return null;

  // Authorization: verify user can access the parent order
  const order = test.sample?.labOrder;
  if (!order) return null;

  // Check role-based access
  const isAuthorized =
    user.role === 'ADMIN' ||
    user.role === 'STATE_OFFICIAL' ||
    user.role === 'DISTRICT_OFFICIAL' ||
    (user.role === 'VETERINARIAN' && (order.requestorId === user.userId || order.case?.assignedVetId === user.userId)) ||
    (user.role === 'FARMER' && order.case?.farm?.ownerId === user.userId);

  return isAuthorized ? test : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Case Transition from Lab Result
// MEDICAL AUTHORITY: Only LAB_PENDING cases are eligible for transition.
// INCONCLUSIVE result does NOT auto-transition — vet review required.
// ─────────────────────────────────────────────────────────────────────────────

const { validateStatusTransition, recordStatusHistory } = (() => {
  try {
    return require('./caseService');
  } catch {
    // Graceful fallback if caseService not accessible
    return {
      validateStatusTransition: () => ({ valid: false, error: 'caseService unavailable' }),
      recordStatusHistory: async () => {}
    };
  }
})();

async function triggerCaseTransitionFromResult(caseId, resultOutcome, userId) {
  if (!caseId) return { transitioned: false, reason: 'No case linked to this order' };

  const vetCase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!vetCase) return { transitioned: false, reason: 'Case not found' };
  if (vetCase.status !== 'LAB_PENDING') {
    return { transitioned: false, reason: `Case is ${vetCase.status} — only LAB_PENDING cases transition on lab result` };
  }

  let newStatus = null;
  if (resultOutcome === 'POSITIVE')     newStatus = 'CONFIRMED';
  if (resultOutcome === 'NEGATIVE')     newStatus = 'REJECTED';
  if (resultOutcome === 'INCONCLUSIVE') {
    return { transitioned: false, reason: 'INCONCLUSIVE result — veterinary review required before case status change' };
  }

  if (!newStatus) return { transitioned: false, reason: 'Unknown result outcome' };

  const transition = validateStatusTransition(vetCase.status, newStatus);
  if (!transition.valid) {
    return { transitioned: false, reason: transition.error };
  }

  await prisma.case.update({
    where: { id: caseId },
    data:  { status: newStatus }
  });

  await recordStatusHistory(
    caseId,
    vetCase.status,
    newStatus,
    userId,
    `Lab result: ${resultOutcome} — automatic case transition`
  );

  return { transitioned: true, oldStatus: vetCase.status, newStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe Response Formatting
// Strips internal FK strings; includes enriched relations
// ─────────────────────────────────────────────────────────────────────────────

function formatLabOrderResponse(order) {
  if (!order) return null;
  return {
    id:           order.id,
    orderNumber:  order.orderNumber,
    status:       order.status,
    priority:     order.priority,
    createdAt:    order.createdAt,
    updatedAt:    order.updatedAt,
    case:         order.case   ? {
      id:           order.case.id,
      caseNumber:   order.case.caseNumber,
      status:       order.case.status,
      animal:       order.case.animal,
      farm:         order.case.farm,
    } : null,
    labFacility:      order.labFacility || null,
    requestor:        order.requestor   || null,
    suspectedDisease: order.suspectedDisease || null,
    samples: (order.samples || []).map(s => ({
      id:         s.id,
      sampleCode: s.sampleCode,
      sampleType: s.sampleType || null,
      collectedAt: s.collectedAt,
      collectedBy: s.collectedBy,
      tests: (s.tests || []).map(t => ({
        id:               t.id,
        testName:         t.testName,
        status:           t.status,
        diagnosticMethod: t.diagnosticMethod || null,
        // NOTE: results are from laboratory — NOT from Brain risk assessment
        results: (t.results || []).map(r => ({
          id:                r.id,
          resultOutcome:     r.resultOutcome,  // POSITIVE / NEGATIVE / INCONCLUSIVE
          quantitativeValue: r.quantitativeValue || null,
          remarks:           r.remarks          || null,
          verifiedBy:        r.verifiedBy       || null,
          verifiedAt:        r.verifiedAt       || null,
          createdAt:         r.createdAt,
          // Explicit label: this is a lab result, not Brain risk or vet assessment
          _authority: 'LABORATORY_RESULT',
        }))
      }))
    }))
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Status State Machine
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ORDER_TRANSITIONS = {
  ORDERED:           ['SAMPLE_COLLECTED'],
  SAMPLE_COLLECTED:  ['IN_TRANSIT'],
  IN_TRANSIT:        ['RECEIVED'],
  RECEIVED:          ['TESTING'],
  TESTING:           ['COMPLETED'],
  COMPLETED:         [],
};

function validateOrderStatusTransition(current, proposed) {
  const allowed = VALID_ORDER_TRANSITIONS[current] || [];
  if (allowed.includes(proposed)) return { valid: true };
  return {
    valid: false,
    error: `Invalid order status transition: ${current} → ${proposed}. Allowed from ${current}: [${allowed.join(', ') || 'none — terminal'}]`
  };
}

module.exports = {
  generateOrderNumber,
  generateSampleCode,
  getLabOrderScope,
  getAuthorizedLabOrder,
  getAuthorizedLabTest,
  triggerCaseTransitionFromResult,
  validateOrderStatusTransition,
  formatLabOrderResponse,
};
