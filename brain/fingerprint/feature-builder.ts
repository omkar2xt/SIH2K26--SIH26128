export function buildFingerprintFeatures(current: any, baseline: any) {
  return {
    activityRatio: baseline.activity > 0 ? (current.activity || 80) / baseline.activity : 1.0,
    feedingRatio: baseline.feeding > 0 ? (current.feeding || 80) / baseline.feeding : 1.0,
    movementRatio: baseline.movement > 0 ? (current.movement || 80) / baseline.movement : 1.0,
    ruminationRatio: baseline.rumination > 0 ? (current.rumination || 80) / baseline.rumination : 1.0,
  };
}
