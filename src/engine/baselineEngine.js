/**
 * PASHU-RAKSHA Baseline Engine — Adapter
 * Delegates calculation to unified brain/fingerprint module.
 */
import { computeBaseline as brainComputeBaseline } from '../../brain/fingerprint/baseline-engine.ts';

export function computeBaseline(animal, observations = []) {
  return brainComputeBaseline(animal, observations);
}

export function build7DayHistory(animal, observations = []) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const dayStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    const dayObs = observations
      .filter(o => o.animalId === animal.id && (o.currentReadings || o.activityLevel != null))
      .find(o => {
        const d = new Date(o.timestamp);
        return d.getFullYear() === date.getFullYear() &&
               d.getMonth() === date.getMonth() &&
               d.getDate() === date.getDate();
      });

    if (dayObs?.currentReadings) {
      days.push({ day: dayStr, ...dayObs.currentReadings });
    } else {
      const pct = (6 - i) / 6;
      const b = animal.baseline || {};
      const c = animal.current || {};
      days.push({
        day: dayStr,
        activity: Math.round((b.activity || 80) + ((c.activity || 80) - (b.activity || 80)) * pct),
        feeding: Math.round((b.feeding || 80) + ((c.feeding || 80) - (b.feeding || 80)) * pct),
        movement: Math.round((b.movement || 80) + ((c.movement || 80) - (b.movement || 80)) * pct),
        rumination: Math.round((b.rumination || 80) + ((c.rumination || 80) - (b.rumination || 80)) * pct),
      });
    }
  }
  return days;
}
