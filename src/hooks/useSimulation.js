import { useState, useEffect, useCallback } from 'react';
import { DEMO_DB_INITIAL } from '../data/demoDB';
import { applySimulationStep, SIMULATION_STEPS } from '../engine/simulationEngine';
import { runRuleEngine } from '../engine/ruleEngine';

export function useSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  
  // Base DB initialization
  const [liveData, setLiveData] = useState(() => {
    let db = { ...DEMO_DB_INITIAL };
    db.animals = db.animals.map(a => ({ ...a, riskEval: runRuleEngine(a, db) }));
    return db;
  });

  // Effect to apply steps when demoStep changes
  useEffect(() => {
    if (demoStep === 0) {
      let db = { ...DEMO_DB_INITIAL };
      db.animals = db.animals.map(a => ({ ...a, riskEval: runRuleEngine(a, db) }));
      setLiveData(db);
    } else {
      setLiveData(prev => applySimulationStep(prev, demoStep));
    }
  }, [demoStep]);

  // Autoplay interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setDemoStep(s => (s < SIMULATION_STEPS ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleSimulation = () => setIsRunning(r => !r);
  
  const nextStep = () => {
    setDemoStep(s => Math.min(s + 1, SIMULATION_STEPS));
    setIsRunning(false); // Pause on manual step
  };
  
  const prevStep = () => {
    setDemoStep(s => Math.max(s - 1, 0));
    setIsRunning(false);
  };
  
  const resetDemo = useCallback(() => {
    setDemoStep(0);
    setIsRunning(false);
  }, []);

  // CRUD actions exposed for UI
  const addReport = useCallback((report) => {
    setLiveData(prev => ({ ...prev, observations: [...prev.observations, { ...report, id: `OBS_${Date.now()}` }] }));
  }, []);

  const addAnimal = useCallback((animal) => {
    setLiveData(prev => ({ ...prev, animals: [...prev.animals, { ...animal, id: `AN_${Date.now()}` }] }));
  }, []);
  
  const updateCaseStage = useCallback((caseId, stage) => {
    setLiveData(prev => ({ ...prev, cases: prev.cases.map(c => c.id === caseId ? { ...c, stage } : c) }));
  }, []);

  const addLabSample = useCallback((sample) => {
    setLiveData(prev => ({ ...prev, labSamples: [...prev.labSamples, { ...sample, id: `SMP_${Date.now()}` }] }));
  }, []);

  const updateLabResult = useCallback((sampleId, result) => {
    setLiveData(prev => ({ ...prev, labSamples: prev.labSamples.map(s => s.id === sampleId ? { ...s, result } : s) }));
  }, []);

  const updateAlertStatus = useCallback((alertId, status) => {
    setLiveData(prev => ({ ...prev, alerts: prev.alerts.map(a => a.id === alertId ? { ...a, status } : a) }));
  }, []);

  const updateContainmentStatus = useCallback((id, status) => {
    setLiveData(prev => ({ ...prev, containment: prev.containment?.map(c => c.id === id ? { ...c, status } : c) }));
  }, []);

  return {
    isRunning, toggleSimulation, liveData, demoStep, totalSteps: SIMULATION_STEPS,
    actions: { nextStep, prevStep, resetDemo, addReport, addAnimal, updateCaseStage, addLabSample, updateLabResult, updateAlertStatus, updateContainmentStatus }
  };
}
