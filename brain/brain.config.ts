/**
 * PASHU-RAKSHA Brain Global Configuration
 */
export const BRAIN_CONFIG = {
  version: '2.0.0-BRAIN',
  knowledgeVersion: 'KB-MH-1.0',
  ruleVersion: 'RULES-MH-1.0',
  riskEngineVersion: 'RISK-V2',
  baselineWindowDays: 7,
  monsoonMultiplier: 1.3,
  monsoonMonths: [6, 7, 8, 9], // June to September in Maharashtra
  featureFlags: {
    enableIotTelemetry: true,
    enableCameraSignals: true,
    enableExposureTracing: true,
    enableDistrictClustering: true,
    enableStrictZoonoticEscalation: true,
  },
  modelMode: 'VALIDATED_PILOT',
  simulationMode: false,
};
