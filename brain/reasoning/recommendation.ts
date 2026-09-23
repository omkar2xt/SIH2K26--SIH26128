import { RiskLevel } from '../contracts/risk.types';

export function getRecommendedAction(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'IMMEDIATE veterinary intervention required. Isolate animal. Notify district authority.';
    case 'RED':
      return 'Veterinary review urgently recommended. Laboratory confirmation required for diagnosis.';
    case 'ORANGE':
      return 'Field veterinary verification recommended within 24 hours.';
    case 'YELLOW':
      return 'Monitor closely. Report if condition worsens.';
    default:
      return 'Continue routine monitoring.';
  }
}
