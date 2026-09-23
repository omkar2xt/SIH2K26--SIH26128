const TRANSMISSION_WEIGHTS: Record<string, number> = {
  'Direct contact': 3,
  'Fomites': 2,
  'Livestock movement': 2,
  'Shared feed/water': 2,
  'Equine congregation': 2,
  'Indirect environmental': 1,
  'Shared water': 1,
  'Vector-borne insects': 1,
  'Tick-borne': 1,
  'Mosquito-borne': 1,
  'Mechanical transmission by biting flies': 1,
  'Environmental/water': 1,
  'Soil/environmental spores': 1,
  'Bites': 2,
  'Wildlife-dog exposure': 2,
  'Abrupt diet/feed change': 0,
};

function maxTransmissionWeight(disease: any) {
  if (!disease?.exposureTypes) return 1;
  return Math.max(1, ...disease.exposureTypes.map((t: string) => TRANSMISSION_WEIGHTS[t] || 1));
}

export function runExposureEngine(db: any = {}) {
  const rawEvents = db.exposureEvents || [];
  if (rawEvents.length === 0) return [];

  const riskMap: Record<string, string> = {};
  (db.animals || []).forEach((a: any) => {
    if (a.riskEval) riskMap[a.id] = a.riskEval.healthRiskLevel;
  });

  return rawEvents.map((evt: any) => {
    const source = (db.animals || []).find((a: any) => a.id === evt.sourceId) || {};
    const target = (db.animals || []).find((a: any) => a.id === evt.targetId) || {};
    const disease = (db.diseases || []).find((d: any) => d.id === evt.diseaseId) || null;

    const sourceRisk = riskMap[evt.sourceId] || 'GREEN';
    const txWeight = maxTransmissionWeight(disease);

    const proximityScore = Math.min(10,
      (1 / Math.max(1, evt.distance || 5)) * 10 * 0.3 +
      Math.min(evt.contacts || 1, 10) * 0.4 +
      Math.min(evt.duration || 5, 60) * 0.05
    );

    const severityMap: Record<string, number> = { CRITICAL: 5, RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 };
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
      compositeRisk: Math.round(compositeRisk * 10) / 10,
      riskLevel,
      transmissionWeight: txWeight,
    };
  }).sort((a: any, b: any) => b.compositeRisk - a.compositeRisk);
}

export function getAnimalExposures(animalId: string, db: any = {}) {
  const enriched = runExposureEngine(db);
  return enriched.filter((e: any) => e.sourceId === animalId || e.targetId === animalId);
}
