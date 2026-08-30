/** Animal Service — CRUD + rule-engine evaluation */
import { store } from '../db/store.js';
import { runRuleEngine } from '../engine/ruleEngine.js';
import { runExposureEngine } from '../engine/exposureEngine.js';

function enrichAnimal(animal, db) {
  const species  = db.species.find(s => s.id === animal.speciesId) || {};
  const breed    = db.breeds.find(b => b.id === animal.breedId)    || {};
  const farm     = db.farms.find(f => f.id === animal.farmId)      || {};
  const riskEval = runRuleEngine(animal, db);
  return { ...animal, species, breed, farm, farmName: farm.name || '—', riskEval };
}

export const animalService = {
  /** Get all animals enriched with species/breed/farm/riskEval */
  getAll(filters = {}) {
    const db       = store.snapshot();
    let animals    = db.animals.map(a => enrichAnimal(a, db));

    if (filters.farmId)   animals = animals.filter(a => a.farmId   === filters.farmId);
    if (filters.speciesId) animals = animals.filter(a => a.speciesId === filters.speciesId);
    if (filters.district)  animals = animals.filter(a => a.farm?.district === filters.district);
    if (filters.riskLevel) animals = animals.filter(a => a.riskEval?.healthRiskLevel === filters.riskLevel);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      animals = animals.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.species?.name?.toLowerCase().includes(q) ||
        a.breed?.name?.toLowerCase().includes(q)
      );
    }
    return animals;
  },

  getById(id) {
    const db     = store.snapshot();
    const animal = db.animals.find(a => a.id === id);
    if (!animal) return null;

    const enriched = enrichAnimal(animal, db);

    // Attach related records
    enriched.vaccinations  = db.vaccinations.filter(v => v.animalId === id);
    enriched.observations  = db.observations.filter(o => o.animalId === id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    enriched.cases         = db.cases.filter(c => c.animalId === id);
    enriched.labSamples    = db.labSamples.filter(s => s.animalId === id);
    enriched.alerts        = db.alerts.filter(al => al.animalId === id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Exposure events involving this animal
    const exposures = runExposureEngine({ ...db, targetAnimalId: id });
    enriched.exposures = exposures;

    // 7-day activity history (simulated from baseline + current)
    enriched.history7d = buildHistory7d(animal);

    return enriched;
  },

  add(data) {
    const animal = store.insert('animals', {
      ...data,
      registeredAt: new Date().toISOString(),
      baseline: data.baseline || { activity: 90, feeding: 88, movement: 87, rumination: 83 },
      current:  data.current  || { activity: 90, feeding: 88, movement: 87, rumination: 83, tempTrend: 'normal', social: 'normal' },
    });
    store.audit('ANIMAL_ADDED', animal.id, null, `New animal ${animal.id} registered`);
    return animal;
  },

  update(id, patch) {
    const updated = store.update('animals', id, patch);
    store.audit('ANIMAL_UPDATED', id, null, `Animal ${id} updated`);
    return updated;
  },

  addObservation(animalId, obs, userId) {
    const observation = store.insert('observations', {
      animalId,
      ...obs,
      timestamp: new Date().toISOString(),
      reportedBy: obs.reportedBy || userId || 'Unknown',
    });
    // Update current readings if provided
    if (obs.currentReadings) {
      store.update('animals', animalId, { current: obs.currentReadings, lastObservation: new Date().toISOString() });
    }
    store.audit('OBSERVATION_ADDED', observation.id, userId, `Observation added for ${animalId}`);
    return observation;
  },
};

// Build a synthetic 7-day history trending from baseline toward current
function buildHistory7d(animal) {
  const b = animal.baseline;
  const c = animal.current;
  return Array.from({ length: 7 }, (_, i) => {
    const pct = i / 6;
    return {
      day: `Day ${i + 1}`,
      activity: Math.round(b.activity + (c.activity - b.activity) * pct),
      feeding:  Math.round(b.feeding  + (c.feeding  - b.feeding)  * pct),
      movement: Math.round(b.movement + (c.movement  - b.movement) * pct),
      rumination: Math.round(b.rumination + (c.rumination - b.rumination) * pct),
    };
  });
}
