/**
 * PASHU-RAKSHA Brain — Deviation Detector
 * Computes individual percentage drops between current readings and historical baseline.
 */

export function calculateBaselineDeviation(current: any = {}, baseline: any = {}) {
  let actDrop = 0, feedDrop = 0, moveDrop = 0, rumDrop = 0;
  
  if (baseline) {
    const currAct = current.activity ?? current.activityLevel ?? 80;
    const currFeed = current.feeding ?? current.feedingMinutes ?? 80;
    const currMove = current.movement ?? current.movementMeters ?? 80;
    const currRum = current.rumination ?? current.ruminationMinutes ?? 80;

    if (baseline.activity > 0) actDrop = Math.max(0, ((baseline.activity - currAct) / baseline.activity) * 100);
    if (baseline.feeding > 0) feedDrop = Math.max(0, ((baseline.feeding - currFeed) / baseline.feeding) * 100);
    if (baseline.movement > 0) moveDrop = Math.max(0, ((baseline.movement - currMove) / baseline.movement) * 100);
    if (baseline.rumination > 0) rumDrop = Math.max(0, ((baseline.rumination - currRum) / baseline.rumination) * 100);
  }

  return {
    actDrop: Math.round(actDrop),
    feedDrop: Math.round(feedDrop),
    moveDrop: Math.round(moveDrop),
    rumDrop: Math.round(rumDrop),
  };
}
