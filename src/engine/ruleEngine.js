/**
 * PASHU-RAKSHA Rule Engine — Adapter
 * Delegates evaluation to unified brain/risk-engine module.
 */
import { calculateBaselineDeviation as brainCalculateDeviation } from '../../brain/fingerprint/deviation-detector.ts';
import { orchestrateRisk } from '../../brain/risk-engine/risk-orchestrator.ts';

export function calculateBaselineDeviation(current, baseline) {
  return brainCalculateDeviation(current, baseline);
}

export function runRuleEngine(animal, db) {
  return orchestrateRisk(animal, db);
}
