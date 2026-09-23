import { RiskLevel } from '../contracts/risk.types';

export function scoreToRiskLevel(score: number, isRecumbentAndFever: boolean = false): { healthRiskLevel: RiskLevel; healthAbnormality: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' } {
  let healthRiskLevel: RiskLevel = 'GREEN';

  if (score >= 10 || isRecumbentAndFever) healthRiskLevel = 'CRITICAL';
  else if (score >= 7) healthRiskLevel = 'RED';
  else if (score >= 4) healthRiskLevel = 'ORANGE';
  else if (score >= 2) healthRiskLevel = 'YELLOW';

  const healthAbnormality = score === 0 ? 'NONE' : score >= 7 ? 'SEVERE' : score >= 4 ? 'MODERATE' : 'MILD';

  return { healthRiskLevel, healthAbnormality };
}
