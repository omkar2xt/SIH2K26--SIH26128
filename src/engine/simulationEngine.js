/**
 * PASHU-RAKSHA Simulation Engine — v2
 * 20-step outbreak scenario: multi-animal cascade + vaccination + containment.
 */
import { runRuleEngine } from './ruleEngine.js';
import { runExposureEngine } from './exposureEngine.js';
import { runClusterEngine } from './clusterEngine.js';

export const SIMULATION_STEPS = 20;

export function applySimulationStep(db, step) {
  let next = JSON.parse(JSON.stringify(db));

  // ── Primary animal: MH-CAT-027 (Cattle, FARM_A, Nashik) ──────────────────
  const idx027 = next.animals.findIndex(a => a.id === 'MH-CAT-027');
  if (idx027 !== -1) {
    const c = next.animals[idx027].current;
    if (step >= 2)  { c.activity  = Math.max(10, c.activity  - 12); }
    if (step >= 3)  { c.feeding   = Math.max(10, c.feeding   - 15); }
    if (step >= 4)  { c.tempTrend = 'elevated'; }
    if (step >= 5)  { c.social    = 'isolating'; c.movement = Math.max(10, c.movement - 20); }
    if (step >= 6)  { c.lameness  = true; c.activity = Math.max(10, c.activity - 10); }
    if (step >= 8)  { c.social    = 'recumbent'; c.feeding = Math.max(5, c.feeding - 10); }
  }

  // ── Step 6: Exposure event — MH-CAT-027 → MH-CAT-031 ────────────────────
  if (step >= 6) {
    const exists = next.exposureEvents.some(e => e.sourceId === 'MH-CAT-027' && e.targetId === 'MH-CAT-031');
    if (!exists) next.exposureEvents.push({
      id: `EXP_SIM_${Date.now()}`,
      sourceId: 'MH-CAT-027', targetId: 'MH-CAT-031',
      distance: 4.2, contacts: 6, duration: 18,
      lastContact: new Date().toISOString(), riskLevel: 'HIGH', diseaseId: 'DIS_01',
    });
  }

  // ── Step 8: Secondary animal deteriorates (MH-CAT-031) ───────────────────
  const idx031 = next.animals.findIndex(a => a.id === 'MH-CAT-031');
  if (step >= 8 && idx031 !== -1) {
    const c = next.animals[idx031].current;
    c.activity  = Math.max(20, c.activity  - 20);
    c.feeding   = Math.max(20, c.feeding   - 25);
    c.tempTrend = 'elevated';
    c.social    = 'isolating';
  }

  // ── Step 10: Alert generated for primary ─────────────────────────────────
  if (step >= 10) {
    const exists = next.alerts.some(a => a.animalId === 'MH-CAT-027' && a.status === 'OPEN' && a.severity === 'RED');
    if (!exists) next.alerts.push({
      id: `AL_SIM_${Date.now()}`,
      animalId: 'MH-CAT-027', severity: 'RED',
      message: 'Simulation: Activity 47% below baseline; elevated temperature; lameness; isolating — veterinary review required.',
      createdAt: new Date().toISOString(), status: 'OPEN', source: 'simulation',
    });
  }

  // ── Step 11: Case opened ──────────────────────────────────────────────────
  if (step >= 11) {
    const exists = next.cases.some(c => c.animalId === 'MH-CAT-027');
    if (!exists) next.cases.push({
      id: `CASE_SIM_${Date.now()}`,
      animalId: 'MH-CAT-027', stage: 'Accepted',
      suspectedDiseaseId: 'DIS_01',
      clinicalObservations: null, sampleId: null,
      notes: 'Simulation: FMD suspected. Field review initiated.',
      openedAt: new Date().toISOString(), assignedVet: 'Dr. A. Kulkarni',
    });
  }

  // ── Step 12: Field review + sample collected ──────────────────────────────
  if (step >= 12) {
    const simCase = next.cases.find(c => c.animalId === 'MH-CAT-027');
    if (simCase) {
      simCase.stage = 'Sample Collected';
      simCase.clinicalObservations = 'Vesicular lesions on tongue and hooves. Drooling. Reduced mobility. Elevated temperature.';
      simCase.sampleType = 'Vesicular fluid';
      simCase.collectionDate = new Date().toISOString().split('T')[0];
    }
  }

  // ── Step 13: Lab submitted ────────────────────────────────────────────────
  if (step >= 13) {
    const simCase = next.cases.find(c => c.animalId === 'MH-CAT-027');
    if (simCase && simCase.stage === 'Sample Collected') {
      simCase.stage = 'Lab Submitted';
      const smpExists = next.labSamples.some(s => s.animalId === 'MH-CAT-027' && s.result === 'Pending');
      if (!smpExists) next.labSamples.push({
        id: `SMP_SIM_${Date.now()}`,
        caseId: simCase.id,
        animalId: 'MH-CAT-027',
        sampleType: 'Vesicular fluid / Epithelial tissue',
        test: 'RT-PCR',
        laboratory: 'Regional Disease Diagnostic Laboratory, Pune',
        collectionDate: new Date().toISOString().split('T')[0],
        submittedDate:  new Date().toISOString().split('T')[0],
        result: 'Pending',
        suspectedDiseaseId: 'DIS_01',
        collectedBy: 'Dr. A. Kulkarni',
      });
    }
  }

  // ── Step 14: Alert for secondary (MH-CAT-031) ────────────────────────────
  if (step >= 14) {
    const exists = next.alerts.some(a => a.animalId === 'MH-CAT-031' && a.status === 'OPEN');
    if (!exists) next.alerts.push({
      id: `AL_SIM2_${Date.now()}`,
      animalId: 'MH-CAT-031', severity: 'ORANGE',
      message: 'Simulation: Secondary exposure alert — activity and feeding drop following contact with MH-CAT-027.',
      createdAt: new Date().toISOString(), status: 'OPEN', source: 'simulation',
    });
  }

  // ── Step 15: Lab result — Positive ───────────────────────────────────────
  if (step >= 15) {
    const simCase = next.cases.find(c => c.animalId === 'MH-CAT-027');
    if (simCase) simCase.stage = 'Confirmed / Rejected';
    const sample = next.labSamples.find(s => s.animalId === 'MH-CAT-027');
    if (sample) { sample.result = 'Positive'; sample.resultDate = new Date().toISOString().split('T')[0]; }
  }

  // ── Step 16: CRITICAL escalation ─────────────────────────────────────────
  if (step >= 16) {
    const alert = next.alerts.find(a => a.animalId === 'MH-CAT-027' && a.status === 'OPEN');
    if (alert) alert.severity = 'CRITICAL';
    const idx031e = next.animals.findIndex(a => a.id === 'MH-CAT-031');
    if (idx031e !== -1) {
      next.animals[idx031e].current.social = 'recumbent';
      next.animals[idx031e].current.tempTrend = 'elevated';
    }
  }

  // ── Step 17: Action — isolation order ────────────────────────────────────
  if (step >= 17) {
    const simCase = next.cases.find(c => c.animalId === 'MH-CAT-027');
    if (simCase) { simCase.stage = 'Action'; simCase.action = 'Isolate animals. Movement restriction applied. Notify district authority.'; }
  }

  // ── Step 18: Containment zone created ────────────────────────────────────
  if (step >= 18) {
    if (!next.containmentZones) next.containmentZones = [];
    const exists = next.containmentZones.some(z => z.id === 'ZONE_SIM_01');
    if (!exists) next.containmentZones.push({
      id: 'ZONE_SIM_01',
      district: 'Nashik',
      description: 'Nashik District — 5 km radius containment zone (Simulated FMD outbreak)',
      diseaseId: 'DIS_01',
      reason: 'Laboratory-confirmed FMD (simulation)',
      status: 'ACTIVE',
      startTime: new Date().toISOString(),
      farmIds: ['FARM_A'],
      restrictedMovement: true,
    });
  }

  // ── Step 19: Vaccination campaign initiated ───────────────────────────────
  if (step >= 19) {
    const simCase = next.cases.find(c => c.animalId === 'MH-CAT-027');
    if (simCase) simCase.stage = 'Follow-up';
  }

  // ── Step 20: Follow-up + herd recovery ───────────────────────────────────
  if (step >= 20) {
    const simCase = next.cases.find(c => c.animalId === 'MH-CAT-027');
    if (simCase) { simCase.stage = 'Follow-up'; simCase.outcome = 'Contained. FMD confirmed. Ring vaccination ongoing.'; }
  }

  // ── Re-evaluate all engines ───────────────────────────────────────────────
  next.animals = next.animals.map(a => ({ ...a, riskEval: runRuleEngine(a, next) }));
  next.exposureEvents = runExposureEngine(next);
  next.clusters = runClusterEngine(next);

  return next;
}
