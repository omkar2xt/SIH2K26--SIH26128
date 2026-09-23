import { TelemetryReadings, BaselineReadings, DataSourceType } from './evidence.types';
import { RiskAnalysisResult } from './risk.types';

export interface BrainAnimalInput {
  id: string;
  tagId: string;
  speciesId?: string;
  current: TelemetryReadings;
  baseline: BaselineReadings;
  dataSource?: DataSourceType;
}

export interface BrainAnalysisRequest {
  animal: BrainAnimalInput;
  observations?: any[];
  exposureEvents?: any[];
  diseases?: any[];
}

export interface BrainAnalysisResponse {
  animalId: string;
  riskEval: RiskAnalysisResult;
  evaluatedAt: string;
}
