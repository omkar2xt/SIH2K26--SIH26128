import { EvidenceReason } from './evidence.types';

export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'CRITICAL';

export interface MatchedDiseaseRisk {
  disease: any;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  dScore: number;
  why: string[];
  isZoonotic: boolean;
  isNotifiable: boolean;
}

export interface RiskAnalysisResult {
  healthRiskLevel: RiskLevel;
  healthAbnormality: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  score: number;
  reasons: EvidenceReason[];
  actDrop: number;
  feedDrop: number;
  moveDrop: number;
  rumDrop: number;
  diseaseRisks: MatchedDiseaseRisk[];
  recommendedAction: string;
  zonoticRisk: boolean;
  confidence: 'High' | 'Moderate' | 'Low' | 'N/A';
  urgency: RiskLevel;
  evaluatedAt: string;
}
