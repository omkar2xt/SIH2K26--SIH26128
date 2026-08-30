/** Report Service — summary stats, district overview, CSV export */
import { store } from '../db/store.js';

export const reportService = {
  getStateSummary() {
    const db = store.snapshot();
    const today = new Date().toISOString().split('T')[0];

    const highRisk = db.animals.filter(a => {
      const s = a.current?.social;
      const t = a.current?.tempTrend;
      const actDrop = a.baseline?.activity > 0
        ? ((a.baseline.activity - a.current.activity) / a.baseline.activity) * 100 : 0;
      return actDrop >= 25 || s === 'recumbent' || (s === 'isolating' && t === 'elevated');
    }).length;

    return {
      totalAnimals:    db.animals.length,
      totalFarms:      db.farms.length,
      openAlerts:      db.alerts.filter(a => a.status === 'OPEN').length,
      criticalAlerts:  db.alerts.filter(a => a.status === 'OPEN' && a.severity === 'CRITICAL').length,
      activeCases:     db.cases.filter(c => c.stage !== 'Closed').length,
      pendingLabs:     db.labSamples.filter(s => s.result === 'Pending').length,
      highRiskAnimals: highRisk,
      activeExposures: db.exposureEvents.length,
      activeClusters:  0,   // cluster engine populates this
      containmentZones: db.containmentZones.filter(z => z.status === 'ACTIVE').length,
      overdueVaccinations: db.vaccinations.filter(v => v.nextDue && v.nextDue < today).length,
    };
  },

  getDistrictStats() {
    const db = store.snapshot();
    const stats = {};

    db.farms.forEach(f => {
      if (!stats[f.district]) stats[f.district] = { district: f.district, farms: 0, animals: 0, openAlerts: 0, highRisk: 0, exposures: 0, activeCases: 0 };
      stats[f.district].farms++;
    });

    db.animals.forEach(a => {
      const farm = db.farms.find(f => f.id === a.farmId);
      if (!farm || !stats[farm.district]) return;
      const d = stats[farm.district];
      d.animals++;
      const hasAlert = db.alerts.some(al => al.animalId === a.id && al.status === 'OPEN');
      if (hasAlert) d.openAlerts++;
      const actDrop = a.baseline?.activity > 0
        ? ((a.baseline.activity - a.current.activity) / a.baseline.activity) * 100 : 0;
      if (actDrop >= 25 || a.current?.social === 'recumbent') d.highRisk++;
      const hasExposure = db.exposureEvents.some(e => e.sourceId === a.id || e.targetId === a.id);
      if (hasExposure) d.exposures++;
    });

    db.cases.forEach(c => {
      if (c.stage === 'Closed') return;
      const animal = db.animals.find(a => a.id === c.animalId);
      const farm   = animal && db.farms.find(f => f.id === animal.farmId);
      if (farm && stats[farm.district]) stats[farm.district].activeCases++;
    });

    return Object.values(stats).map(d => ({
      ...d,
      riskLevel: d.highRisk > 0 ? 'RED' : d.openAlerts > 0 ? 'ORANGE' : d.animals > 0 ? 'YELLOW' : 'GREEN',
    }));
  },

  getDiseaseDistribution() {
    const db = store.snapshot();
    const counts = {};
    db.cases.forEach(c => {
      if (!c.suspectedDiseaseId) return;
      const disease = db.diseases.find(d => d.id === c.suspectedDiseaseId);
      const name = disease?.shortName || c.suspectedDiseaseId;
      counts[name] = (counts[name] || 0) + 1;
    });
    db.alerts.filter(a => a.status === 'OPEN').forEach(al => {
      counts['General Alert'] = (counts['General Alert'] || 0) + 1;
    });
    return Object.entries(counts).map(([disease, cases]) => ({ disease, cases }));
  },

  exportCSV(data, filename) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g,'""')}"`).join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename || 'report.csv'; a.click();
    URL.revokeObjectURL(url);
  },
};
