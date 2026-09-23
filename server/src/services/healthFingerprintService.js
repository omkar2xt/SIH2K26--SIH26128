/**
 * PASHU-RAKSHA Backend Health Fingerprint Service Adapter
 */
function calculateBaseline(observations, defaultBaseline = { activity: 80, feeding: 80, movement: 80, rumination: 80 }) {
  if (!observations || observations.length < 3) return defaultBaseline;
  const sorted = [...observations].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-7);
  const avg = (field) => {
    const vals = sorted.map(o => o[field]).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : defaultBaseline[field];
  };
  return {
    activity: avg('activityLevel'),
    feeding: avg('feedingMinutes'),
    movement: avg('movementMeters'),
    rumination: avg('ruminationMinutes'),
  };
}

function calculateDeviation(current, baseline) {
  const actDrop = baseline.activity > 0 ? Math.max(0, Math.round(((baseline.activity - (current.activity || 80)) / baseline.activity) * 100)) : 0;
  const feedDrop = baseline.feeding > 0 ? Math.max(0, Math.round(((baseline.feeding - (current.feeding || 80)) / baseline.feeding) * 100)) : 0;
  const moveDrop = baseline.movement > 0 ? Math.max(0, Math.round(((baseline.movement - (current.movement || 80)) / baseline.movement) * 100)) : 0;
  const rumDrop = baseline.rumination > 0 ? Math.max(0, Math.round(((baseline.rumination - (current.rumination || 80)) / baseline.rumination) * 100)) : 0;
  return { actDrop, feedDrop, moveDrop, rumDrop };
}

module.exports = { calculateBaseline, calculateDeviation };
