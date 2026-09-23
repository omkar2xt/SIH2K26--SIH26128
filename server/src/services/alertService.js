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

  await prisma.eventSnapshot.create({
    data: {
      eventId: healthEvent.id,
      snapshotJson: JSON.stringify(evaluation),
    }
  });

  const farm = animal.farm || {};
  const district = farm.district ? farm.district.name : 'Unknown District';
  const farmName = farm.name || 'Unknown Farm';
  
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

module.exports = {
  processRiskEvaluation
};
