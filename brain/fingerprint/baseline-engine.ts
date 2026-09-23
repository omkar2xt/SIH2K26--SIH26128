/**
 * PASHU-RAKSHA Brain — Baseline Engine
 * Computes 7-day rolling individual baseline for an animal.
 */

export function computeBaseline(animal: any, observations: any[] = []) {
  const animalObs = observations
    .filter(o => o.animalId === animal.id && (o.currentReadings || o.activityLevel != null))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-7);

  if (animalObs.length < 3) {
    return animal.baseline || { activity: 80, feeding: 80, movement: 80, rumination: 80 };
  }

  const avg = (field: string, fallbackField: string) => {
    const vals = animalObs
      .map(o => o.currentReadings?.[field] ?? o[fallbackField])
      .filter(v => v != null);
    return vals.length
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      : animal.baseline?.[field] || 80;
  };

  return {
    activity: avg('activity', 'activityLevel'),
    feeding: avg('feeding', 'feedingMinutes'),
    movement: avg('movement', 'movementMeters'),
    rumination: avg('rumination', 'ruminationMinutes'),
  };
}
