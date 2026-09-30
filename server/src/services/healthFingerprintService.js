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

function calculateDeviation(current = {}, baseline = { activity: 80, feeding: 80, movement: 80, rumination: 80 }) {
  const cur = current || {};
  const base = baseline || { activity: 80, feeding: 80, movement: 80, rumination: 80 };
  const actDrop = (base.activity || 80) > 0 ? Math.max(0, Math.round((((base.activity || 80) - (cur.activity || 80)) / (base.activity || 80)) * 100)) : 0;
  const feedDrop = (base.feeding || 80) > 0 ? Math.max(0, Math.round((((base.feeding || 80) - (cur.feeding || 80)) / (base.feeding || 80)) * 100)) : 0;
  const moveDrop = (base.movement || 80) > 0 ? Math.max(0, Math.round((((base.movement || 80) - (cur.movement || 80)) / (base.movement || 80)) * 100)) : 0;
  const rumDrop = (base.rumination || 80) > 0 ? Math.max(0, Math.round((((base.rumination || 80) - (cur.rumination || 80)) / (base.rumination || 80)) * 100)) : 0;
  return { actDrop, feedDrop, moveDrop, rumDrop };
}

module.exports = { calculateBaseline, calculateDeviation };
