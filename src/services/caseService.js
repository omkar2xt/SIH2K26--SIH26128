/** Case Service — full 10-stage veterinary case workflow */
import { store } from '../db/store.js';

export const CASE_STAGES = [
  "New Alert",
  "Accepted",
  "Field Review",
  "Sample Collected",
  "Lab Submitted",
  "Lab Result",
  "Confirmed / Rejected",
  "Action",
  "Follow-up",
  "Closed",
];

export const caseService = {
  getAll(filters = {}) {
    const db    = store.snapshot();
    let cases   = db.cases.map(c => enrichCase(c, db));

    if (filters.stage)    cases = cases.filter(c => c.stage === filters.stage);
    if (filters.animalId) cases = cases.filter(c => c.animalId === filters.animalId);
    if (filters.vetId)    cases = cases.filter(c => c.assignedVet === filters.vetId);
    if (filters.open)     cases = cases.filter(c => c.stage !== 'Closed');
    return cases.sort((a,b) => new Date(b.openedAt) - new Date(a.openedAt));
  },

  getById(id) {
    const db   = store.snapshot();
    const c    = db.cases.find(c => c.id === id);
    return c ? enrichCase(c, db) : null;
  },

  open(data, userId) {
    const newCase = store.insert('cases', {
      ...data,
      stage: data.stage || 'New Alert',
      openedAt: new Date().toISOString(),
      assignedVet: data.assignedVet || null,
    });
    store.audit('CASE_OPENED', newCase.id, userId, `Case opened for ${data.animalId}`);
    return newCase;
  },

  updateStage(id, stage, patch = {}, userId) {
    const updated = store.update('cases', id, { stage, ...patch, [`stage_${stage.replace(/\W+/g,'_')}_at`]: new Date().toISOString() });
    store.audit('CASE_STAGE_UPDATED', id, userId, `Case ${id} stage → ${stage}`);
    return updated;
  },

  addClinicalObservations(id, observations, userId) {
    return this.updateStage(id, 'Field Review', { clinicalObservations: observations }, userId);
  },

  recordSampleCollection(id, { sampleId, sampleType, collectionDate, laboratory }, userId) {
    return this.updateStage(id, 'Sample Collected', {
      sampleId, sampleType,
      collectionDate: collectionDate || new Date().toISOString().split('T')[0],
      laboratory,
    }, userId);
  },

  recordLabResult(id, { labResult, labResultDate }, userId) {
    const stage = labResult === 'Positive' ? 'Confirmed / Rejected' : 'Confirmed / Rejected';
    return this.updateStage(id, stage, {
      labResult,
      labResultDate: labResultDate || new Date().toISOString().split('T')[0],
    }, userId);
  },

  close(id, outcome, userId) {
    return this.updateStage(id, 'Closed', { outcome, closedAt: new Date().toISOString() }, userId);
  },

  getStageIndex(stage) {
    return CASE_STAGES.indexOf(stage);
  },

  canAdvance(stage) {
    return CASE_STAGES.indexOf(stage) < CASE_STAGES.length - 1;
  },

  nextStage(stage) {
    const idx = CASE_STAGES.indexOf(stage);
    return idx < CASE_STAGES.length - 1 ? CASE_STAGES[idx + 1] : stage;
  },
};

function enrichCase(c, db) {
  const animal  = db.animals.find(a => a.id === c.animalId) || {};
  const disease = db.diseases.find(d => d.id === c.suspectedDiseaseId) || {};
  const farm    = db.farms.find(f => f.id === animal.farmId) || {};
  const samples = db.labSamples.filter(s => s.caseId === c.id);
  return { ...c, animal, disease, farm, samples, stageIndex: CASE_STAGES.indexOf(c.stage) };
}
