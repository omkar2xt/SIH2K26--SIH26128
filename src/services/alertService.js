/** Alert Service — creation, acknowledgement, escalation */
import { store } from '../db/store.js';

export const alertService = {
  getAll(filters = {}) {
    const db     = store.snapshot();
    let alerts   = db.alerts.map(al => enrichAlert(al, db));
    if (filters.status)   alerts = alerts.filter(a => a.status   === filters.status);
    if (filters.severity) alerts = alerts.filter(a => a.severity === filters.severity);
    if (filters.animalId) alerts = alerts.filter(a => a.animalId === filters.animalId);
    if (filters.district) alerts = alerts.filter(a => a.animal?.farm?.district === filters.district);
    if (filters.open)     alerts = alerts.filter(a => a.status === 'OPEN');
    return alerts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById(id) {
    const db = store.snapshot();
    const al = db.alerts.find(a => a.id === id);
    return al ? enrichAlert(al, db) : null;
  },

  create(data, userId) {
    // De-duplicate: don't create if an OPEN alert of same severity exists for same animal
    const existing = store.query('alerts', a =>
      a.animalId === data.animalId && a.status === 'OPEN' && a.severity === data.severity
    );
    if (existing.length > 0) return existing[0];

    const alert = store.insert('alerts', {
      ...data,
      status:    'OPEN',
      createdAt: new Date().toISOString(),
      source:    data.source || 'ruleEngine',
    });
    store.audit('ALERT_CREATED', alert.id, userId || 'SYSTEM', `${data.severity} alert for ${data.animalId}`);
    return alert;
  },

  acknowledge(id, userId) {
    const updated = store.update('alerts', id, { status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString(), acknowledgedBy: userId });
    store.audit('ALERT_ACKNOWLEDGED', id, userId, `Alert ${id} acknowledged`);
    return updated;
  },

  resolve(id, userId, note) {
    const updated = store.update('alerts', id, { status: 'RESOLVED', resolvedAt: new Date().toISOString(), resolvedBy: userId, resolutionNote: note || '' });
    store.audit('ALERT_RESOLVED', id, userId, `Alert ${id} resolved`);
    return updated;
  },

  escalate(id, newSeverity, userId) {
    const updated = store.update('alerts', id, { severity: newSeverity, escalatedAt: new Date().toISOString() });
    store.audit('ALERT_ESCALATED', id, userId, `Alert ${id} escalated to ${newSeverity}`);
    return updated;
  },

  getOpenCount() {
    return store.query('alerts', a => a.status === 'OPEN').length;
  },

  getCriticalCount() {
    return store.query('alerts', a => a.status === 'OPEN' && a.severity === 'CRITICAL').length;
  },

  getSummaryBySeverity() {
    const all = store.getAll('alerts');
    return ['CRITICAL','RED','ORANGE','YELLOW','GREEN'].reduce((acc, sev) => {
      acc[sev] = all.filter(a => a.severity === sev && a.status === 'OPEN').length;
      return acc;
    }, {});
  },
};

function enrichAlert(al, db) {
  const animal = db.animals.find(a => a.id === al.animalId) || {};
  const farm   = db.farms.find(f => f.id === animal.farmId)  || {};
  return { ...al, animal, farm };
}
