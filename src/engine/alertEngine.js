/**
 * PASHU-RAKSHA Alert Engine
 * Watches rule engine outputs and auto-generates alerts.
 * Prevents duplicate open alerts.
 */
import { store } from '../db/store.js';
import { runRuleEngine } from './ruleEngine.js';

const THRESHOLD_SEVERITY = {
  CRITICAL: 'CRITICAL',
  RED:      'RED',
  ORANGE:   'ORANGE',
  YELLOW:   'YELLOW',
};

function buildAlertMessage(riskEval) {
  const parts = riskEval.reasons.map(r => r.text);
  if (riskEval.zonoticRisk) parts.push('⚠️ Zoonotic disease risk detected — human health relevance.');
  return parts.slice(0, 5).join('; ') + '.';
}

/**
 * Evaluate all animals and create alerts for those crossing thresholds.
 * Called after any data mutation that might affect risk.
 * Returns newly created alerts.
 */
export function runAlertEngine(db) {
  const newAlerts = [];

  (db.animals || []).forEach(animal => {
    const riskEval = runRuleEngine(animal, db);

    // Only alert YELLOW and above
    if (riskEval.healthRiskLevel === 'GREEN') return;

    const severity = THRESHOLD_SEVERITY[riskEval.healthRiskLevel] || 'YELLOW';

    // Check for existing OPEN alert at same or higher severity
    const existing = (db.alerts || []).find(a =>
      a.animalId === animal.id && a.status === 'OPEN' &&
      (a.severity === severity || severityRank(a.severity) >= severityRank(severity))
    );
    if (existing) return;

    const alert = store.insert('alerts', {
      animalId:  animal.id,
      severity,
      message:   buildAlertMessage(riskEval),
      createdAt: new Date().toISOString(),
      status:    'OPEN',
      source:    'alertEngine',
      score:     riskEval.score,
    });
    store.audit('ALERT_AUTO_CREATED', alert.id, 'SYSTEM', `${severity} alert auto-generated for ${animal.id} (score=${riskEval.score})`);
    newAlerts.push(alert);
  });

  return newAlerts;
}

function severityRank(s) {
  return { CRITICAL: 4, RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 }[s] || 0;
}

/** Escalate stale unacknowledged ORANGE/RED alerts older than 2 hours */
export function escalateStaleAlerts(db) {
  const escalated = [];
  const twoHoursAgo = Date.now() - 2 * 3600 * 1000;
  (db.alerts || []).forEach(al => {
    if (al.status !== 'OPEN') return;
    if (severityRank(al.severity) < severityRank('ORANGE')) return;
    if (new Date(al.createdAt).getTime() > twoHoursAgo) return;
    // Already critical — skip
    if (al.severity === 'CRITICAL') return;
    const newSev = al.severity === 'ORANGE' ? 'RED' : 'CRITICAL';
    store.update('alerts', al.id, { severity: newSev, escalatedAt: new Date().toISOString() });
    store.audit('ALERT_ESCALATED', al.id, 'SYSTEM', `Alert auto-escalated to ${newSev} (stale)`);
    escalated.push(al.id);
  });
  return escalated;
}
