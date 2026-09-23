import { RiskLevel } from '../contracts/risk.types';
import { EvidenceReason } from '../contracts/evidence.types';

export function generateExplanation(
  riskLevel: RiskLevel,
  drops: any,
  reasons: EvidenceReason[],
  recommendedAction: string
) {
  return {
    whatChanged: `Activity drop: ${drops.actDrop}%, Feeding drop: ${drops.feedDrop}%, Movement drop: ${drops.moveDrop}%, Rumination drop: ${drops.rumDrop}%.`,
    whyItMatters: reasons.map(r => r.text).join('; '),
    whatIsUncertain: 'Field clinical examination and accredited laboratory testing are required to establish definitive diagnosis.',
    whatNext: recommendedAction,
  };
}
