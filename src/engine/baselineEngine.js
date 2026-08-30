/**
 * PASHU-RAKSHA Baseline Engine — v2
 * Computes 7-day rolling baselines from observation history.
 * Falls back to registered baseline if insufficient history.
 */

export function computeBaseline(animal, observations = []) {
  const animalObs = observations
    .filter(o => o.animalId === animal.id && o.currentReadings)
    .sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-7);

  if (animalObs.length < 3) {
    // Not enough data — use registered baseline
    return animal.baseline;
  }

  const avg = (field) => {
    const vals = animalObs.map(o => o.currentReadings?.[field]).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((a,b) => a + b, 0) / vals.length) : animal.baseline?.[field] || 80;
  };

  return {
    activity:   avg('activity'),
    feeding:    avg('feeding'),
    movement:   avg('movement'),
    rumination: avg('rumination'),
  };
}

/**
 * Returns a 7-day activity history array for charting.
 * Uses observations where available, interpolates otherwise.
 */
export function build7DayHistory(animal, observations = []) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const dayStr = date.toLocaleDateString('en-IN', { day:'2-digit', month:'short' });

    // Find observation closest to this day
    const dayObs = observations
      .filter(o => o.animalId === animal.id && o.currentReadings)
      .filter(o => {
        const d = new Date(o.timestamp);
        return d.getFullYear() === date.getFullYear() &&
               d.getMonth()   === date.getMonth()   &&
               d.getDate()    === date.getDate();
      })[0];

    if (dayObs?.currentReadings) {
      days.push({ day: dayStr, ...dayObs.currentReadings });
    } else {
      // Interpolate: trend from baseline toward current over 7 days
      const pct  = (6 - i) / 6;
      const b    = animal.baseline || {};
      const c    = animal.current  || {};
      days.push({
        day:        dayStr,
        activity:   Math.round((b.activity   || 80) + ((c.activity   || 80) - (b.activity   || 80)) * pct),
        feeding:    Math.round((b.feeding    || 80) + ((c.feeding    || 80) - (b.feeding    || 80)) * pct),
        movement:   Math.round((b.movement   || 80) + ((c.movement   || 80) - (b.movement   || 80)) * pct),
        rumination: Math.round((b.rumination || 80) + ((c.rumination || 80) - (b.rumination || 80)) * pct),
      });
    }
  }
  return days;
}
