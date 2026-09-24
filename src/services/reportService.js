/** Report Service — summary stats, district overview, CSV export */
import { api } from './api/api.js';

export const reportService = {
  async getStateSummary() {
    try {
      const [animRes, farmsRes, alertsRes, casesRes, mapDataRes, vaxStatsRes] = await Promise.all([
        api.animals.getAll(),
        api.farms.getAll(),
        api.alerts.getAll(),
        api.cases.getAll(),
        api.gis.getMapData(),
        api.vaccination.getStats()
      ]);
      
      const animals = Array.isArray(animRes) ? animRes : (animRes?.data || []);
      const farms = Array.isArray(farmsRes) ? farmsRes : (farmsRes?.data || []);
      const alerts = Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []);
      const cases = Array.isArray(casesRes) ? casesRes : (casesRes?.data || []);
      const mapData = mapDataRes?.data || {};
      
      const openAlerts = alerts.filter(a => a.status === 'OPEN').length;
      const criticalAlerts = alerts.filter(a => a.status === 'OPEN' && a.severity === 'CRITICAL').length;
      const activeCases = cases.filter(c => c.status && c.status !== 'CLOSED').length;
      const highRisk = animals.filter(a => a.riskLevel === 'RED' || a.riskLevel === 'CRITICAL').length;
      
      return {
        totalAnimals: animals.length || 0,
        totalFarms: farms.length || 0,
        openAlerts,
        criticalAlerts,
        activeCases,
        pendingLabs: 0,
        highRiskAnimals: highRisk,
        activeExposures: mapData.exposureEvents?.length || 0,
        containmentZones: mapData.containment?.length || 0,
        overdueVaccinations: vaxStatsRes?.data?.overdueCount || 0,
      };
    } catch (e) {
      console.error(e);
      return { totalAnimals: 0, totalFarms: 0, openAlerts: 0, criticalAlerts: 0, activeCases: 0, pendingLabs: 0, highRiskAnimals: 0, activeExposures: 0, containmentZones: 0, overdueVaccinations: 0 };
    }
  },

  async getDistrictStats() {
    try {
      const [farmsRes, animalsRes, alertsRes, casesRes] = await Promise.all([
        api.farms.getAll(), api.animals.getAll(), api.alerts.getAll(), api.cases.getAll()
      ]);
      
      const farms = Array.isArray(farmsRes) ? farmsRes : (farmsRes?.data || []);
      const animals = Array.isArray(animalsRes) ? animalsRes : (animalsRes?.data || []);
      const alerts = Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []);
      const cases = Array.isArray(casesRes) ? casesRes : (casesRes?.data || []);
      
      const stats = {};
      
      farms.forEach(f => {
        const dName = f.district?.name || f.district || 'Unknown';
        if (!stats[dName]) stats[dName] = { district: dName, farms: 0, animals: 0, openAlerts: 0, highRisk: 0, exposures: 0, activeCases: 0 };
        stats[dName].farms++;
      });
      
      animals.forEach(a => {
        const farm = farms.find(f => f.id === a.farmId);
        if (!farm) return;
        const dName = farm.district?.name || farm.district || 'Unknown';
        if (!stats[dName]) return;
        
        stats[dName].animals++;
        if (a.riskLevel === 'RED' || a.riskLevel === 'CRITICAL') stats[dName].highRisk++;
        if (alerts.some(al => al.animalId === a.id && al.status === 'OPEN')) stats[dName].openAlerts++;
      });
      
      cases.forEach(c => {
        if (c.status === 'CLOSED') return;
        const animal = animals.find(a => a.id === c.animalId);
        if (!animal) return;
        const farm = farms.find(f => f.id === animal.farmId);
        if (!farm) return;
        const dName = farm.district?.name || farm.district || 'Unknown';
        if (stats[dName]) stats[dName].activeCases++;
      });
      
      return Object.values(stats).map(d => ({
        ...d,
        riskLevel: d.highRisk > 0 ? 'RED' : d.openAlerts > 0 ? 'ORANGE' : d.animals > 0 ? 'YELLOW' : 'GREEN',
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getDiseaseDistribution() {
    try {
      const casesRes = await api.cases.getAll();
      const cases = Array.isArray(casesRes) ? casesRes : (casesRes?.data || []);
      const counts = {};
      cases.forEach(c => {
        if (!c.suspectedDiseaseId) return;
        const name = c.suspectedDisease?.shortName || c.suspectedDiseaseId;
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts).map(([disease, cases]) => ({ disease, cases }));
    } catch (e) {
      return [];
    }
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
