/**
 * PASHU-RAKSHA Brain — Public API Entry Point
 * Single source of truth for all veterinary intelligence, health fingerprint calculations,
 * evidence fusion, risk scoring, exposure tracing, and spatial-temporal cluster detection.
 */

import { BRAIN_CONFIG } from './brain.config';
import { computeBaseline, calculateBaselineDeviation, calculateConfidence } from './fingerprint';
import { fuseEvidence, generateExplanation, getRecommendedAction } from './reasoning';
import { orchestrateRisk, scoreToRiskLevel, rankDiseases } from './risk-engine';
import { runExposureEngine, getAnimalExposures, runClusterEngine } from './exposure';
import { buildEventSnapshot } from './snapshot';
import { validateKnowledgeBaseData } from './validation';

export { BRAIN_CONFIG };

export function analyzeAnimalHealth(animal: any, db: any = {}) {
  const riskEval = orchestrateRisk(animal, db);
  return {
    animalId: animal.id || animal.tagId,
    riskEval,
    evaluatedAt: new Date().toISOString(),
  };
}

export function calculateHealthFingerprint(animal: any, observations: any[] = []) {
  const baseline = computeBaseline(animal, observations);
  const confidence = calculateConfidence(observations.length);
  return {
    animalId: animal.id || animal.tagId,
    baseline,
    confidence,
    observationCount: observations.length,
  };
}

export function assessDiseaseRisk(animal: any, db: any = {}) {
  return orchestrateRisk(animal, db);
}

export {
  computeBaseline,
  calculateBaselineDeviation,
  calculateConfidence,
  fuseEvidence,
  generateExplanation,
  getRecommendedAction,
  orchestrateRisk,
  scoreToRiskLevel,
  rankDiseases,
  runExposureEngine,
  getAnimalExposures,
  runClusterEngine,
  buildEventSnapshot,
  validateKnowledgeBaseData,
};
