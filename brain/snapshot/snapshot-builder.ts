export function buildEventSnapshot(animal: any, riskEval: any, observations: any[] = [], exposureContext: any[] = []) {
  return {
    snapshotId: `SNP_${animal.id}_${Date.now()}`,
    animalId: animal.id,
    animalTag: animal.tagId,
    farmId: animal.farmId,
    timestamp: new Date().toISOString(),
    riskEval,
    beforeWindow: observations.slice(0, 3),
    eventWindow: observations.slice(-3),
    exposureContext,
    status: 'RECORDED',
  };
}
