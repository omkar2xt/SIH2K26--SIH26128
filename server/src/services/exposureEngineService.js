/**
 * PASHU-RAKSHA Backend Exposure Network Engine Service
 */

const TRANSMISSION_WEIGHTS = {
  'Direct contact': 3,
  'Fomites': 2,
  'Shared feed/water': 2,
  'Livestock movement': 2,
  'Vector-borne': 1,
  'Proximity': 1,
};

function evaluateExposures(events = [], animals = []) {
  const animalRiskMap = {};
  animals.forEach(a => {
    animalRiskMap[a.id] = a.riskLevel || 'GREEN';
  });

  return events.map(evt => {
    const sourceRisk = animalRiskMap[evt.sourceId] || 'GREEN';
    const txWeight = TRANSMISSION_WEIGHTS[evt.exposureType] || 1;
    const distance = evt.distanceMeters || 5.0;

    const proximityScore = Math.min(10, (1 / Math.max(1, distance)) * 10 * 0.4 + (evt.contactCount || 1) * 0.3 + (evt.durationMinutes || 30) * 0.05);

    const severityMap = { CRITICAL: 5, RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 };
    const compositeRisk = (severityMap[sourceRisk] || 1) * proximityScore * txWeight;

    const riskLevel = compositeRisk >= 8 ? 'HIGH' : compositeRisk >= 4 ? 'MEDIUM' : 'LOW';

    return {
      ...evt,
      sourceRisk,
      proximityScore: Math.round(proximityScore * 10) / 10,
      compositeRiskScore: Math.round(compositeRisk * 10) / 10,
      riskLevel,
    };
  }).sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);
}

module.exports = { evaluateExposures };
