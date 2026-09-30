/**
 * PASHU-RAKSHA — Case Service
 * Backend-authoritative veterinary case workflow logic.
 *
 * Responsibilities:
 *  - Case number generation
 *  - Role-based resource scoping (Prisma where clauses)
 *  - Status transition state machine enforcement
 *  - Vet assignment access verification
 *  - Alert→Animal resolution for case creation from alert
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Status Transition State Machine
// Only these transitions are valid. Any other transition is rejected with 400.
// ─────────────────────────────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  SUSPECTED:    ['INVESTIGATING'],
  INVESTIGATING: ['LAB_PENDING', 'CONFIRMED', 'REJECTED'],
  LAB_PENDING:  ['CONFIRMED', 'REJECTED'],
  CONFIRMED:    ['RESOLVED'],
  REJECTED:     ['RESOLVED'],
  RESOLVED:     [], // terminal state
};

const ALL_STATUSES = Object.keys(VALID_TRANSITIONS);

/**
 * Validates a status transition.
 * @param {string} current - existing Case.status
 * @param {string} proposed - requested new status
 * @returns {{ valid: boolean, error?: string }}
 */
function validateStatusTransition(current, proposed) {
  if (!ALL_STATUSES.includes(proposed)) {
    return { valid: false, error: `Invalid status '${proposed}'. Must be one of: ${ALL_STATUSES.join(', ')}` };
  }
  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(proposed)) {
    return {
      valid: false,
      error: `Invalid transition: ${current} → ${proposed}. Allowed: ${current} → [${allowed.join(', ') || 'none — terminal state'}]`
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Case Number Generation
// Format: CASE-YYYY-NNN (zero-padded sequential, year-scoped)
// NOTE: Not fully atomic under high concurrency; acceptable for current scale.
// For production: use a DB sequence or a SERIALIZABLE transaction.
// ─────────────────────────────────────────────────────────────────────────────
async function generateCaseNumber() {
  const year = new Date().getFullYear();
  const prefix = `CASE-${year}-`;

  // Count all cases with this year prefix to derive next sequence number
  const count = await prisma.case.count({
    where: { caseNumber: { startsWith: prefix } }
  });

  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Scoping
// Returns a Prisma `where` clause that restricts case access by the user's role.
// CRITICAL: Do NOT use role-only checks. Use resource relationships.
// ─────────────────────────────────────────────────────────────────────────────
function getCaseResourceScope(user) {
  const { role, userId } = user;

  switch (role) {
    case 'FARMER':
      // Farmers see cases for animals on their own farms
      return { animal: { farm: { ownerId: userId } } };

    case 'FIELD_WORKER':
      // Field workers see cases for animals on farms they own
      return { animal: { farm: { ownerId: userId } } };

    case 'VETERINARIAN':
      // Vets see cases explicitly assigned to them or created by them
      return { OR: [{ assignedVetId: userId }, { createdById: userId }] };

    case 'DISTRICT_OFFICIAL':
    case 'STATE_OFFICIAL':
    case 'ADMIN':
      // Officials and admins see all cases (no additional restriction)
      return {};

    default:
      // Unknown role → see nothing
      return { id: '' }; // effectively returns empty result set
  }
}

/**
 * Builds a single-case resource authorization where clause.
 * Used for GET /cases/:id, PUT /cases/:id/*, POST /cases/:id/assessment
 */
function getCaseAccessFilter(user, caseId) {
  const scope = getCaseResourceScope(user);
  return { ...scope, id: caseId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Vet Assignment Authorization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies a user can access (modify) a specific case.
 * Returns the case or null if not found/unauthorized.
 */
async function getAuthorizedCase(caseId, user) {
  const where = getCaseAccessFilter(user, caseId);
  return prisma.case.findFirst({
    where,
    include: {
      animal: { 
        include: { 
          farm: true,
          healthEvents: {
            include: { snapshots: true },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        } 
      },
      assignedVet: { select: { id: true, fullName: true, username: true } },
      createdBy:   { select: { id: true, fullName: true, username: true } },
      alert: { 
        select: { 
          id: true, 
          title: true, 
          severity: true, 
          animalTag: true,
          healthEvent: {
            include: { snapshots: true }
          }
        } 
      },
      suspectedDisease: true,
      history:     { orderBy: { changedAt: 'desc' } },
    }
  });
}

/**
 * Verifies a target user exists and has the VETERINARIAN role.
 * @returns {{ valid: boolean, vet?: object, error?: string }}
 */
async function verifyTargetIsVet(targetUserId) {
  if (!targetUserId) {
    return { valid: false, error: 'assignedVetId is required' };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { role: true }
  });

  if (!targetUser) {
    return { valid: false, error: 'Target user does not exist' };
  }

  if (targetUser.role.name !== 'VETERINARIAN') {
    return { valid: false, error: `Target user '${targetUser.username}' is not a VETERINARIAN (role: ${targetUser.role.name})` };
  }

  return { valid: true, vet: targetUser };
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert → Animal Resolution
// Used when creating a case from an alert.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the Animal from an Alert via animalTag.
 * @param {string} alertId
 * @returns {{ alert, animal } | null}
 */
async function resolveAnimalFromAlert(alertId) {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) return null;

  // Try tagId first, then fall back to id prefix match
  const animal = await prisma.animal.findFirst({
    where: {
      OR: [
        { tagId: alert.animalTag },
        { id: alert.animalTag }
      ]
    },
    include: { farm: true }
  });

  return animal ? { alert, animal } : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deduplication Check
// Prevents creating multiple open cases for the same animal.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if an active (non-terminal) case already exists for this animal.
 * Terminal statuses: RESOLVED, REJECTED
 */
async function hasActiveCaseForAnimal(animalId) {
  const existing = await prisma.case.findFirst({
    where: {
      animalId,
      status: { notIn: ['RESOLVED', 'REJECTED'] }
    }
  });
  return !!existing;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status History Recording
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a CaseStatusHistory record for an audit trail.
 */
async function recordStatusHistory(caseId, oldStatus, newStatus, changedByUserId, notes) {
  return prisma.caseStatusHistory.create({
    data: {
      caseId,
      oldStatus,
      newStatus,
      changedBy: changedByUserId || null,
      notes:     notes || null,
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe Case Response Shape
// Strips internal fields, ensures medical authority language is correct.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a raw Case DB record to a safe API response object.
 * Enforces medical authority language.
 */
function formatCaseResponse(c) {
  return {
    id:               c.id,
    caseNumber:       c.caseNumber,
    status:           c.status,
    priority:         c.priority,
    animalId:         c.animalId,
    farmId:           c.farmId,
    assignedVetId:    c.assignedVetId,
    createdById:      c.createdById,
    alertId:          c.alertId,
    // Medical authority separation:
    // - clinicalNotes: brain/system-generated risk context (NOT a diagnosis)
    // - vetAssessment: recorded by a veterinarian (their clinical assessment)
    // - suspectedDiseaseId: "suspected" — not confirmed
    // Neither field constitutes laboratory confirmation or official clinical diagnosis.
    clinicalNotes:    c.clinicalNotes    || null,
    vetAssessment:    c.vetAssessment    || null,
    vetAssessmentAt:  c.vetAssessmentAt  || null,
    suspectedDiseaseId: c.suspectedDiseaseId || null,
    // Enriched relations (when included)
    animal:           c.animal           || undefined,
    farm:             c.farm             || undefined,
    assignedVet:      c.assignedVet      || undefined,
    createdBy:        c.createdBy        || undefined,
    alert:            c.alert            || undefined,
    suspectedDisease: c.suspectedDisease || undefined,
    history:          c.history          || undefined,
    snapshots: (() => {
      const all = (c.alert?.healthEvent?.snapshots || []).concat(
        (c.animal?.healthEvents || []).flatMap(he => he.snapshots || [])
      );
      const seen = new Set();
      const unique = [];
      for (const s of all) {
        if (s && s.id && !seen.has(s.id)) {
          seen.add(s.id);
          unique.push(s);
        }
      }
      return unique.map(s => {
        let parsed = null;
        try {
          parsed = typeof s.snapshotJson === 'string' ? JSON.parse(s.snapshotJson) : s.snapshotJson;
        } catch (e) {
          parsed = s.snapshotJson;
        }
        return {
          id: s.id,
          eventId: s.eventId,
          createdAt: s.createdAt,
          data: parsed,
        };
      });
    })(),
    createdAt:        c.createdAt,
    updatedAt:        c.updatedAt,
  };
}

module.exports = {
  validateStatusTransition,
  generateCaseNumber,
  getCaseResourceScope,
  getCaseAccessFilter,
  getAuthorizedCase,
  verifyTargetIsVet,
  resolveAnimalFromAlert,
  hasActiveCaseForAnimal,
  recordStatusHistory,
  formatCaseResponse,
  ALL_STATUSES,
  VALID_TRANSITIONS,
};
