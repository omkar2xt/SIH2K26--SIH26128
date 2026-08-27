export function calculateDeviation(baselineVal, currentVal) {
  if (!baselineVal) return 0;
  return Math.round(((baselineVal - currentVal) / baselineVal) * 100);
}

export function buildBaseline(readings) {
  if (!readings || readings.length === 0) return null;
  // A simple average baseline generation for demo purposes
  const sum = readings.reduce((acc, curr) => ({
    activity: acc.activity + curr.activity,
    feeding: acc.feeding + curr.feeding,
    movement: acc.movement + curr.movement,
    rumination: acc.rumination + curr.rumination
  }), { activity: 0, feeding: 0, movement: 0, rumination: 0 });
  
  const count = readings.length;
  return {
    activity: Math.round(sum.activity / count),
    feeding: Math.round(sum.feeding / count),
    movement: Math.round(sum.movement / count),
    rumination: Math.round(sum.rumination / count),
    tempTrend: "stable",
    social: "normal"
  };
}

export function compareToBaseline(baseline, current) {
  return {
    activityDeviation: calculateDeviation(baseline.activity, current.activity),
    feedingDeviation: calculateDeviation(baseline.feeding, current.feeding),
    movementDeviation: calculateDeviation(baseline.movement, current.movement),
    ruminationDeviation: calculateDeviation(baseline.rumination, current.rumination),
    tempChange: baseline.tempTrend !== current.tempTrend ? current.tempTrend : "none",
    socialChange: baseline.social !== current.social ? current.social : "none"
  };
}

export function getBaselineStatus(baseline, current) {
  const comparison = compareToBaseline(baseline, current);
  const deviations = [comparison.activityDeviation, comparison.feedingDeviation, comparison.movementDeviation, comparison.ruminationDeviation];
  const maxDev = Math.max(...deviations);
  
  if (maxDev > 25 || comparison.tempChange === "elevated") return "DEVIATED";
  if (maxDev > 10) return "WARNING";
  return "NORMAL";
}
