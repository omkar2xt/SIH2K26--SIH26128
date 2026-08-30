/** Vaccination Service — records, coverage, overdue detection */
import { store } from '../db/store.js';

export const vaccinationService = {
  getAll(filters = {}) {
    const db   = store.snapshot();
    let recs   = db.vaccinations.map(v => enrichVac(v, db));
    if (filters.animalId)  recs = recs.filter(v => v.animalId  === filters.animalId);
    if (filters.diseaseId) recs = recs.filter(v => v.diseaseId === filters.diseaseId);
    if (filters.status)    recs = recs.filter(v => v.status    === filters.status);
    return recs.sort((a,b) => new Date(b.date) - new Date(a.date));
  },

  add(data, userId) {
    const vac = store.insert('vaccinations', {
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      status: computeStatus(data.nextDue),
    });
    store.audit('VACCINATION_ADDED', vac.id, userId, `Vaccination ${vac.vaccineName} for ${data.animalId}`);
    return vac;
  },

  getOverdue() {
    const db   = store.snapshot();
    const today = new Date().toISOString().split('T')[0];
    return db.vaccinations
      .filter(v => v.nextDue && v.nextDue < today)
      .map(v => enrichVac(v, db));
  },

  getCoverageByDistrict() {
    const db        = store.snapshot();
    const districts = {};

    db.farms.forEach(f => {
      if (!districts[f.district]) districts[f.district] = { total: 0, vaccinated: 0, overdue: 0 };
    });

    db.animals.forEach(a => {
      const farm = db.farms.find(f => f.id === a.farmId);
      if (!farm) return;
      const d = districts[farm.district];
      if (!d) return;
      d.total++;
      const vacs  = db.vaccinations.filter(v => v.animalId === a.id);
      const today = new Date().toISOString().split('T')[0];
      const hasCurrent = vacs.some(v => !v.nextDue || v.nextDue >= today);
      const hasOverdue  = vacs.some(v => v.nextDue && v.nextDue < today);
      if (hasCurrent)  d.vaccinated++;
      if (hasOverdue)  d.overdue++;
    });

    return Object.entries(districts).map(([district, stats]) => ({
      district,
      ...stats,
      coverage: stats.total > 0 ? Math.round((stats.vaccinated / stats.total) * 100) : 0,
    }));
  },

  getCoverageByDisease() {
    const db      = store.snapshot();
    const today   = new Date().toISOString().split('T')[0];
    const totals  = db.animals.length;
    const byDisease = {};

    db.diseases.forEach(d => { byDisease[d.id] = { disease: d, covered: 0, overdue: 0, total: totals }; });
    db.vaccinations.forEach(v => {
      if (!byDisease[v.diseaseId]) return;
      if (!v.nextDue || v.nextDue >= today) byDisease[v.diseaseId].covered++;
      else byDisease[v.diseaseId].overdue++;
    });

    return Object.values(byDisease).map(r => ({
      ...r,
      coverage: totals > 0 ? Math.round((r.covered / totals) * 100) : 0,
    })).filter(r => r.covered > 0 || r.overdue > 0);
  },
};

function computeStatus(nextDue) {
  if (!nextDue) return 'Current';
  const today = new Date().toISOString().split('T')[0];
  return nextDue < today ? 'Overdue' : 'Current';
}

function enrichVac(v, db) {
  const animal  = db.animals.find(a => a.id === v.animalId)  || {};
  const disease = db.diseases.find(d => d.id === v.diseaseId) || {};
  const farm    = db.farms.find(f => f.id === animal.farmId)  || {};
  return { ...v, animal, disease, farm, status: computeStatus(v.nextDue) };
}
