import { calculateBaselineDeviation } from '../fingerprint/deviation-detector';
import { calculateConfidence } from '../fingerprint/confidence';
import { fuseEvidence } from '../reasoning/evidence-fusion';
import { getRecommendedAction } from '../reasoning/recommendation';
import { scoreToRiskLevel } from './anomaly-score';
import { rankDiseases } from './disease-ranking';
import { RiskAnalysisResult } from '../contracts/risk.types';

export function orchestrateRisk(animal: any, db: any = {}): RiskAnalysisResult {
  const current = animal.current || {};
  const baseline = animal.baseline || { activity: 80, feeding: 80, movement: 80, rumination: 80 };
  const drops = calculateBaselineDeviation(current, baseline);

  const month = new Date().getMonth() + 1;
  const isMonsoon = month >= 6 && month <= 9;

  const exposed = (db.exposureEvents || []).some((e: any) => e.targetId === animal.id || e.sourceId === animal.id);

  const { score, reasons } = fuseEvidence(current, baseline, drops, isMonsoon, exposed);
  const isRecumbentFever = current.social === 'recumbent' && current.tempTrend === 'elevated';

  let { healthRiskLevel, healthAbnormality } = scoreToRiskLevel(score, isRecumbentFever);

  const diseaseRisks = rankDiseases(animal, db, drops);

  const zonoticRisk = diseaseRisks.some(d => d.isZoonotic && d.risk === 'HIGH');
  if (zonoticRisk && healthRiskLevel !== 'CRITICAL') healthRiskLevel = 'RED';

  const recommendedAction = getRecommendedAction(healthRiskLevel);
  const confidence = score > 0 ? (score >= 7 ? 'High' : 'Moderate') : 'N/A';

  return {
    healthAbnormality,
    healthRiskLevel,
    diseaseRisks,
    score,
    reasons,
    actDrop: drops.actDrop,
    feedDrop: drops.feedDrop,
    moveDrop: drops.moveDrop,
    rumDrop: drops.rumDrop,
    recommendedAction,
    zonoticRisk,
    confidence,
    urgency: healthRiskLevel,
    evaluatedAt: new Date().toISOString(),
  };
}
