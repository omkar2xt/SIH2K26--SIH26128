/**
 * useSimulation — v2
 * Central state manager. Connects store.js (persistence) + all engines.
 * Exposes liveData derived from DB + all CRUD actions.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { store } from '../db/store.js';
import { applySimulationStep, SIMULATION_STEPS } from '../engine/simulationEngine.js';
import { runRuleEngine } from '../engine/ruleEngine.js';
import { runExposureEngine } from '../engine/exposureEngine.js';
import { runClusterEngine } from '../engine/clusterEngine.js';
import { runAlertEngine, escalateStaleAlerts } from '../engine/alertEngine.js';

function buildLiveData() {
  const db = store.snapshot();
  // Enrich animals with riskEval
  db.animals = db.animals.map(a => ({ ...a, riskEval: runRuleEngine(a, db) }));
  // Run exposure + cluster engines
  db.exposureEvents = runExposureEngine(db);
  db.clusters       = runClusterEngine(db);
  return db;
}

export function useSimulation() {
  const [isRunning, setIsRunning]   = useState(false);
  const [demoStep,  setDemoStep]    = useState(0);
  const [liveData,  setLiveData]    = useState(() => buildLiveData());
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSync, setPendingSync] = useState(() => store.getAll('syncQueue').length);

  // Refresh from store
  const refresh = useCallback(() => { setLiveData(buildLiveData()); }, []);

  // ── Simulation step effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (demoStep === 0) {
      store.reset();
      setLiveData(buildLiveData());
    } else {
      setLiveData(prev => applySimulationStep(prev, demoStep));
    }
  }, [demoStep]);

  // ── Autoplay interval ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => {
      setDemoStep(s => (s < SIMULATION_STEPS ? s + 1 : s));
    }, 3500);
    return () => clearInterval(iv);
  }, [isRunning]);

  // ── Periodic alert escalation check (every 30s) ────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const db = store.snapshot();
      const escalated = escalateStaleAlerts(db);
      if (escalated.length > 0) refresh();
    }, 30000);
    return () => clearInterval(iv);
  }, [refresh]);

  // ── Simulation controls ────────────────────────────────────────────────────
  const toggleSimulation = () => setIsRunning(r => !r);
  const nextStep = useCallback(() => { setDemoStep(s => Math.min(s+1, SIMULATION_STEPS)); setIsRunning(false); }, []);
  const prevStep = useCallback(() => { setDemoStep(s => Math.max(s-1, 0)); setIsRunning(false); }, []);
  const resetDemo = useCallback(() => { setDemoStep(0); setIsRunning(false); }, []);

  // ── CRUD actions (all persist to store + refresh liveData) ─────────────────
  const addAnimal = useCallback((data) => {
    store.insert('animals', { ...data, id: `AN_${Date.now()}`, registeredAt: new Date().toISOString(),
      baseline: data.baseline || { activity:88, feeding:86, movement:87, rumination:83 },
      current:  data.current  || { activity:88, feeding:86, movement:87, rumination:83, tempTrend:'normal', social:'normal' },
    });
    store.audit('ANIMAL_ADDED', data.id || 'new', null, `New animal added`);
    refresh();
  }, [refresh]);

  const addObservation = useCallback((animalId, obs) => {
    store.insert('observations', { animalId, ...obs, timestamp: new Date().toISOString(), id: `OBS_${Date.now()}` });
    if (obs.currentReadings) store.update('animals', animalId, { current: obs.currentReadings, lastObservation: new Date().toISOString() });
    // Run alert engine after any observation
    const db = store.snapshot();
    runAlertEngine(db);
    refresh();
  }, [refresh]);

  const updateCaseStage = useCallback((caseId, stage, patch = {}) => {
    store.update('cases', caseId, { stage, ...patch });
    store.audit('CASE_STAGE_UPDATED', caseId, null, `Stage → ${stage}`);
    refresh();
  }, [refresh]);

  const openCase = useCallback((data) => {
    const c = store.insert('cases', { ...data, id: `CASE_${Date.now()}`, stage: 'Accepted', openedAt: new Date().toISOString() });
    store.audit('CASE_OPENED', c.id, null, `Case opened for ${data.animalId}`);
    refresh();
    return c;
  }, [refresh]);

  const addLabSample = useCallback((sample) => {
    const s = store.insert('labSamples', { ...sample, id: `SMP_${Date.now()}`, result: 'Pending' });
    if (sample.caseId) store.update('cases', sample.caseId, { stage: 'Lab Submitted' });
    store.audit('SAMPLE_ADDED', s.id, null, `Sample for ${sample.animalId}`);
    refresh();
    return s;
  }, [refresh]);

  const updateLabResult = useCallback((sampleId, result, notes) => {
    store.update('labSamples', sampleId, { result, labNotes: notes || '', resultDate: new Date().toISOString().split('T')[0] });
    const sample = store.getById('labSamples', sampleId);
    if (sample?.caseId) store.update('cases', sample.caseId, { stage: 'Confirmed / Rejected', labResult: result });
    store.audit('LAB_RESULT_ENTERED', sampleId, null, `Result: ${result}`);
    refresh();
  }, [refresh]);

  const updateAlertStatus = useCallback((alertId, status, note) => {
    store.update('alerts', alertId, { status, [`${status.toLowerCase()}At`]: new Date().toISOString(), resolutionNote: note || '' });
    store.audit('ALERT_STATUS_CHANGED', alertId, null, `Status → ${status}`);
    refresh();
  }, [refresh]);

  const addVaccination = useCallback((data) => {
    const v = store.insert('vaccinations', { ...data, id: `VAC_${Date.now()}` });
    store.audit('VACCINATION_ADDED', v.id, null, `Vaccination for ${data.animalId}`);
    refresh();
    return v;
  }, [refresh]);

  const addContainmentZone = useCallback((data) => {
    const z = store.insert('containmentZones', { ...data, id: `ZONE_${Date.now()}`, status: 'ACTIVE', startTime: new Date().toISOString() });
    store.audit('CONTAINMENT_CREATED', z.id, null, `Zone: ${data.description}`);
    refresh();
    return z;
  }, [refresh]);

  const updateContainmentStatus = useCallback((id, status) => {
    store.update('containmentZones', id, { status });
    store.audit('CONTAINMENT_UPDATED', id, null, `Status → ${status}`);
    refresh();
  }, [refresh]);

  const addFarm = useCallback((data) => {
    const f = store.insert('farms', { ...data, id: `FARM_${Date.now()}` });
    store.audit('FARM_ADDED', f.id, null, `Farm: ${data.name}`);
    refresh();
    return f;
  }, [refresh]);

  const addReport = useCallback((obs) => {
    if (offlineMode) {
      store.enqueueSync({ type: 'OBSERVATION', data: obs });
      setPendingSync(n => n + 1);
    } else {
      store.insert('observations', { ...obs, id: `OBS_${Date.now()}`, timestamp: new Date().toISOString() });
    }
    refresh();
  }, [offlineMode, refresh]);

  const syncNow = useCallback(() => {
    const queued = store.drainSyncQueue();
    queued.forEach(op => {
      if (op.type === 'OBSERVATION') store.insert('observations', { ...op.data, id: `OBS_${Date.now()}`, timestamp: new Date().toISOString() });
    });
    setPendingSync(0);
    setOfflineMode(false);
    refresh();
    return queued.length;
  }, [refresh]);

  const toggleOffline = useCallback(() => {
    setOfflineMode(m => !m);
  }, []);

  const resetDB = useCallback(() => {
    store.reset();
    setDemoStep(0);
    setIsRunning(false);
    setOfflineMode(false);
    setPendingSync(0);
    refresh();
  }, [refresh]);

  return {
    isRunning, toggleSimulation, liveData, demoStep, totalSteps: SIMULATION_STEPS,
    offlineMode, pendingSync, refresh,
    actions: {
      nextStep, prevStep, resetDemo, resetDB,
      addAnimal, addObservation, addReport,
      openCase, updateCaseStage,
      addLabSample, updateLabResult,
      updateAlertStatus,
      addVaccination,
      addContainmentZone, updateContainmentStatus,
      addFarm,
      syncNow, toggleOffline,
    },
  };
}
