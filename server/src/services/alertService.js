const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function severityRank(s) {
  return { CRITICAL: 4, RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 }[s] || 0;
}

function buildAlertMessage(riskEval) {
  const parts = (riskEval.reasons || []).map(r => r.text || typeof r === 'string' ? r : '');
  if (riskEval.zonoticRisk) parts.push('⚠️ Zoonotic disease risk detected — human health relevance.');
  return parts.slice(0, 5).join('; ') + '.';
}

async function processRiskEvaluation(animal, evaluation, io) {
  if (!evaluation || !evaluation.riskLevel) return null;
  const severity = evaluation.riskLevel;
  
  if (severity === 'GREEN') return null;

  // Deduplication check: existing OPEN alert with same or higher severity
  const existingAlerts = await prisma.alert.findMany({
    where: {
      animalTag: animal.tagId || animal.id,
      status: 'OPEN',
    }
  });

  const hasDuplicate = existingAlerts.some(a => severityRank(a.severity) >= severityRank(severity));
  if (hasDuplicate) return null;

  const message = buildAlertMessage(evaluation);

  const healthEvent = await prisma.healthEvent.create({
    data: {
      animalId: animal.id,
      severity,
      summary: message,
    }
  });

  const farm = animal.farm || {};
  const district = farm.district ? (farm.district.name || farm.district) : 'Unknown District';
  const farmName = farm.name || 'Unknown Farm';

  const snapshotPayload = {
    ...evaluation,
    snapshotId: `SNP_${animal.id.slice(0, 8)}_${Date.now()}`,
    animalId: animal.id,
    animalTag: animal.tagId || animal.id,
    farmName,
    district,
    severity,
    summary: message,
    evaluation,
    timestamp: new Date().toISOString()
  };

  await prisma.eventSnapshot.create({
    data: {
      eventId: healthEvent.id,
      snapshotJson: JSON.stringify(snapshotPayload),
    }
  });
  
  let diseaseName = null;
  if (evaluation.matchedDiseases && evaluation.matchedDiseases.length > 0) {
    diseaseName = evaluation.matchedDiseases[0].name;
  }

  const alert = await prisma.alert.create({
    data: {
      healthEventId: healthEvent.id,
      title: `${severity} Alert: ${animal.tagId || animal.id.slice(0,8)}`,
      severity,
      status: 'OPEN',
      district,
      farmName,
      animalTag: animal.tagId || animal.id,
      diseaseName,
      recommendedAction: evaluation.recommendedAction || 'Veterinary inspection recommended.',
    }
  });

  if (io) {
    io.to(`farm_${animal.farmId}`).emit('new_alert', alert);
  }

  return alert;
}

const ALLOWED_RESOLVE_ROLES = ['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN'];

/**
 * Resolves an alert in a backend-authoritative manner.
 * 
 * Enforces:
 *  - Existence (404 NOT_FOUND)
 *  - Authorized clinical / official roles only (403 FORBIDDEN)
 *  - Cross-tenant isolation (403 FORBIDDEN if tenant mismatch)
 *  - Idempotency & state protection (409 ALREADY_RESOLVED if already resolved)
 *  - Medical authority boundaries: does NOT auto-confirm linked cases or alter lab orders
 *  - Mass-assignment protection: updates only status and records acknowledgement
 *  - Server-determined timestamps and user identity
 * 
 * @param {string} alertId - UUID of the alert to resolve
 * @param {object} user - Authenticated user payload from JWT ({ userId, username, role, tenantId, ... })
 * @param {string} [resolutionNote] - Optional resolution note provided by user
 * @returns {Promise<{ success: boolean, data?: object, status?: number, code?: string, message?: string }>}
 */
async function resolveAlert(alertId, user, resolutionNote) {
  if (!user || !user.role) {
    return { status: 401, code: 'UNAUTHORIZED', message: 'Authentication required' };
  }

  if (!ALLOWED_RESOLVE_ROLES.includes(user.role)) {
    return { status: 403, code: 'FORBIDDEN', message: 'Access denied: only authorized clinical/official roles may resolve alerts' };
  }

  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      healthEvent: {
        include: {
          animal: {
            include: {
              farm: true
            }
          }
        }
      },
      cases: {
        select: {
          id: true,
          caseNumber: true,
          status: true
        }
      }
    }
  });

  if (!alert) {
    return { status: 404, code: 'NOT_FOUND', message: 'Alert not found' };
  }

  // Cross-tenant verification
  const alertFarmTenantId = alert.healthEvent?.animal?.farm?.tenantId;
  if (alertFarmTenantId && user.role !== 'ADMIN') {
    if (user.tenantId && user.tenantId !== alertFarmTenantId) {
      return { status: 403, code: 'FORBIDDEN', message: 'Unauthorized: cross-tenant alert access denied' };
    }
    const userTenants = await prisma.tenantUser.findMany({
      where: { userId: user.userId },
      select: { tenantId: true }
    });
    if (userTenants.length > 0) {
      const tenantIds = userTenants.map(t => t.tenantId);
      if (user.tenantId) tenantIds.push(user.tenantId);
      if (!tenantIds.includes(alertFarmTenantId)) {
        return { status: 403, code: 'FORBIDDEN', message: 'Unauthorized: cross-tenant alert access denied' };
      }
    }
  }

  // State check: cannot resolve an already resolved alert
  if (alert.status === 'RESOLVED') {
    return { status: 409, code: 'ALREADY_RESOLVED', message: 'Alert is already resolved' };
  }

  const cleanNote = resolutionNote && typeof resolutionNote === 'string' ? resolutionNote.trim() : null;

  // Perform database update
  const updatedAlert = await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'RESOLVED',
    }
  });

  // Record resolution acknowledgement record for audit and history
  await prisma.alertAcknowledgement.create({
    data: {
      alertId: alert.id,
      userId: user.userId,
      notes: cleanNote ? `[RESOLVED] ${cleanNote}` : '[RESOLVED]',
    }
  });

  return {
    success: true,
    data: {
      id: updatedAlert.id,
      healthEventId: updatedAlert.healthEventId,
      title: updatedAlert.title,
      severity: updatedAlert.severity,
      status: updatedAlert.status,
      district: updatedAlert.district,
      farmName: updatedAlert.farmName,
      animalTag: updatedAlert.animalTag,
      diseaseName: updatedAlert.diseaseName,
      recommendedAction: updatedAlert.recommendedAction,
      resolvedAt: updatedAlert.updatedAt,
      resolvedBy: {
        id: user.userId,
        username: user.username,
        role: user.role
      },
      resolutionNote: cleanNote,
      createdAt: updatedAlert.createdAt,
      updatedAt: updatedAlert.updatedAt
    }
  };
}

module.exports = {
  processRiskEvaluation,
  resolveAlert
};
