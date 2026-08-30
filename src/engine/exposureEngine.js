/**
 * PASHU-RAKSHA Exposure Engine — v2
 * Builds contact network and risk-weights exposures by disease transmission type.
 * Returns ranked exposure list; does NOT produce diagnosis.
 */

// Transmission type → risk weight
const TRANSMISSION_WEIGHTS = {
  'Direct contact':               3,
  'Fomites':                      2,
  'Livestock movement':           2,
  'Shared feed/water':            2,
  'Equine congregation':          2,
  'Indirect environmental':       1,
  'Shared water':                 1,
  'Vector-borne insects':         1,
  'Tick-borne':                   1,
  'Mosquito-borne':               1,
  'Mechanical transmission by biting flies': 1,
  'Environmental/water':          1,
  'Soil/environmental spores':    1,
  'Bites':                        2,
  'Wildlife-dog exposure':        2,
  'Abrupt diet/feed change':      0,  // not transmissible animal-to-animal
};

function maxTransmissionWeight(disease) {
  if (!disease?.exposureTypes) return 1;
  return Math.max(1, ...disease.exposureTypes.map(t => TRANSMISSION_WEIGHTS[t] || 1));
}

export function runExposureEngine(db) {
  const rawEvents = db.exposureEvents || [];
  if (rawEvents.length === 0) return [];

  // Build a set of high-risk source animals (those with elevated risk eval)
  const riskMap = {};
  (db.animals || []).forEach(a => {
    if (a.riskEval) riskMap[a.id] = a.riskEval.healthRiskLevel;
  });

  return rawEvents.map(evt => {
    const source  = (db.animals || []).find(a => a.id === evt.sourceId) || {};
    const target  = (db.animals || []).find(a => a.id === evt.targetId) || {};
    const disease = (db.diseases || []).find(d => d.id === evt.diseaseId) || null;

    const sourceRisk = riskMap[evt.sourceId] || 'GREEN';
    const txWeight   = maxTransmissionWeight(disease);

    // Proximity score: closer, more contacts, longer → higher
    const proximityScore = Math.min(10,
      (1 / Math.max(1, evt.distance)) * 10 * 0.3 +
      Math.min(evt.contacts || 1, 10)    * 0.4 +
      Math.min(evt.duration  || 5, 60)   * 0.05
    );

    // Combine source severity + proximity + transmission weight
    const severityMap = { CRITICAL: 5, RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 };
    const compositeRisk = (severityMap[sourceRisk] || 1) * proximityScore * txWeight;

    let riskLevel = 'LOW';
    if (compositeRisk >= 8) riskLevel = 'HIGH';
    else if (compositeRisk >= 4) riskLevel = 'MEDIUM';

    return {
      ...evt,
      source,
      target,
      disease,
      sourceRisk,
      proximityScore: Math.round(proximityScore * 10) / 10,
      compositeRisk:  Math.round(compositeRisk  * 10) / 10,
      riskLevel,
      transmissionWeight: txWeight,
    };
  }).sort((a,b) => b.compositeRisk - a.compositeRisk);
}

/** Returns exposure events relevant to a specific animal (as source or target) */
export function getAnimalExposures(animalId, db) {
  const enriched = runExposureEngine(db);
  return enriched.filter(e => e.sourceId === animalId || e.targetId === animalId);
}
