import { runRuleEngine } from './ruleEngine';
import { runExposureEngine } from './exposureEngine';
import { runClusterEngine } from './clusterEngine';
import { DEMO_DB_INITIAL } from '../data/demoDB';

export const SIMULATION_STEPS = 15;

export function applySimulationStep(db, step) {
  // Deep clone to avoid mutating the initial or current state directly
  let nextDb = JSON.parse(JSON.stringify(db));
  
  const targetId = "MH-CAT-027";
  const targetIdx = nextDb.animals.findIndex(a => a.id === targetId);
  if (targetIdx === -1) return nextDb;
  
  let current = nextDb.animals[targetIdx].current;

  // Step logic applied cumulatively
  if (step >= 2) { current.activity -= 20; }
  if (step >= 3) { current.feeding -= 30; }
  if (step >= 4) { current.tempTrend = "elevated"; }
  if (step >= 5) { current.social = "isolating"; }
  
  // Step 6: Health Abnormality High is handled by rule engine evaluating above changes
  
  // Step 8: Nearby animals detected -> inject exposure event
  if (step >= 8) {
    if (!nextDb.exposureEvents.some(e => e.sourceId === targetId)) {
      nextDb.exposureEvents.push({
        sourceId: targetId,
        targetId: "MH-CAT-014",
        distance: 4.2,
        contacts: 3,
        duration: 15,
        lastContact: "2 hours ago"
      });
    }
  }

  // Step 10: Alert created
  if (step >= 10) {
    if (!nextDb.alerts.some(a => a.animalId === targetId)) {
      nextDb.alerts.push({
        id: `AL_SIM_${Date.now()}`,
        animalId: targetId,
        severity: "RED",
        createdAt: new Date().toISOString(),
        status: "OPEN"
      });
    }
  }

  // Step 11: Case opened
  if (step >= 11) {
    if (!nextDb.cases.some(c => c.animalId === targetId)) {
      nextDb.cases.push({
        id: `CASE_SIM_${Date.now()}`,
        animalId: targetId,
        stage: "Field Review",
        suspectedDisease: "DIS_01",
        notes: "Automated simulation alert escalation."
      });
    }
  }

  // Step 12: Sample collected
  if (step >= 12) {
    const caseObj = nextDb.cases.find(c => c.animalId === targetId);
    if (caseObj) caseObj.stage = "Sample Collected";
  }

  // Step 13: Lab submitted
  if (step >= 13) {
    const caseObj = nextDb.cases.find(c => c.animalId === targetId);
    if (caseObj) caseObj.stage = "Lab Submitted";
    
    if (!nextDb.labSamples.some(s => s.animalId === targetId)) {
      nextDb.labSamples.push({
        id: `SMP_SIM_${Date.now()}`,
        caseId: caseObj?.id || "N/A",
        animalId: targetId,
        type: "Blood / Serum",
        test: "ELISA",
        date: new Date().toISOString().split('T')[0],
        result: "Pending"
      });
    }
  }

  // Step 14: Lab result recorded
  if (step >= 14) {
    const caseObj = nextDb.cases.find(c => c.animalId === targetId);
    if (caseObj) caseObj.stage = "Confirmed / Rejected";
    
    const sample = nextDb.labSamples.find(s => s.animalId === targetId);
    if (sample) sample.result = "Positive";
  }

  // Step 15: Containment
  if (step >= 15) {
    const caseObj = nextDb.cases.find(c => c.animalId === targetId);
    if (caseObj) caseObj.stage = "Action";
    
    if (!nextDb.containment) nextDb.containment = [];
    nextDb.containment.push({
      id: "CONT_SIM",
      zone: "Nashik District - 5km radius",
      reason: "Confirmed FMD outbreak (simulated)",
      status: "ACTIVE",
      startTime: new Date().toISOString()
    });
  }

  // Run all engines on the updated state to propagate derived data
  nextDb.animals.forEach(a => {
    a.riskEval = runRuleEngine(a, nextDb);
  });
  nextDb.exposureEvents = runExposureEngine(nextDb);
  nextDb.clusters = runClusterEngine(nextDb);

  return nextDb;
}
