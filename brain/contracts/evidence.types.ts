export type DataSourceType = 
  | 'REAL_SENSOR' 
  | 'REAL_CAMERA' 
  | 'FIELD_WORKER' 
  | 'VETERINARIAN' 
  | 'LAB' 
  | 'SIMULATOR' 
  | 'IMPORTED';

export interface TelemetryReadings {
  activity?: number;
  activityLevel?: number;
  feeding?: number;
  feedingMinutes?: number;
  movement?: number;
  movementMeters?: number;
  rumination?: number;
  ruminationMinutes?: number;
  temperatureCelsius?: number;
  tempTrend?: 'normal' | 'elevated' | 'critical';
  social?: 'normal' | 'isolating' | 'recumbent';
  lameness?: boolean;
  nasal_discharge?: boolean;
  skin_lesions?: boolean;
  abortion_event?: boolean;
}

export interface BaselineReadings {
  activity: number;
  feeding: number;
  movement: number;
  rumination: number;
}

export interface EvidenceReason {
  type: 'iot' | 'camera' | 'clinical' | 'behavior' | 'farmer' | 'epidemiological';
  text: string;
}
