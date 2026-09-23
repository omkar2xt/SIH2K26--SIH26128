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
  // Disabled: Alert generation is now authoritative via backend (Step 2G)
  return [];
}

function severityRank(s) {
  return { CRITICAL: 4, RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 }[s] || 0;
}

/** Escalate stale unacknowledged ORANGE/RED alerts older than 2 hours */
export function escalateStaleAlerts(db) {
  // Disabled: Alert generation is now authoritative via backend (Step 2G)
  return [];
}
