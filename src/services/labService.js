/** Lab Service — sample lifecycle and result management */
import { store } from '../db/store.js';

export const LAB_TESTS = [
  "RT-PCR", "ELISA", "Bacterial culture & sensitivity", "Blood smear (Giemsa)",
  "IFAT", "CATT/T. evansi", "Mallein test", "Complement Fixation Test",
  "Milk Ring Test", "Serology (IgM ELISA)", "PCR", "Post-mortem examination",
  "Toxin detection",
];

export const SAMPLE_TYPES = [
  "Blood / Serum", "Nasal swab", "Vesicular fluid", "Epithelial tissue",
  "Urine", "Milk", "Skin biopsy", "Lymph node biopsy",
  "Nasal/ocular swab", "Muscle tissue", "Brain tissue", "Intestinal content",
];

export const LABS = [
  "Regional Disease Diagnostic Laboratory, Pune",
  "Regional Disease Diagnostic Laboratory, Nagpur",
  "State Veterinary Biological & Research Institute, Pune",
  "ICAR-NRCE Hisar (Glanders reference)",
  "ICAR-NRC on Equines",
  "District Veterinary Laboratory",
];

export const labService = {
  getAll(filters = {}) {
    const db      = store.snapshot();
    let samples   = db.labSamples.map(s => enrichSample(s, db));
    if (filters.caseId)   samples = samples.filter(s => s.caseId   === filters.caseId);
    if (filters.animalId) samples = samples.filter(s => s.animalId === filters.animalId);
    if (filters.result)   samples = samples.filter(s => s.result   === filters.result);
    if (filters.pending)  samples = samples.filter(s => s.result   === 'Pending');
    return samples.sort((a,b) => new Date(b.collectionDate) - new Date(a.collectionDate));
  },

  getById(id) {
    const db = store.snapshot();
    const s  = db.labSamples.find(s => s.id === id);
    return s ? enrichSample(s, db) : null;
  },

  addSample(data, userId) {
    const sample = store.insert('labSamples', {
      ...data,
      result: 'Pending',
      collectionDate: data.collectionDate || new Date().toISOString().split('T')[0],
      submittedDate:  data.submittedDate  || new Date().toISOString().split('T')[0],
      collectedBy: data.collectedBy || userId || 'Unknown',
    });
    // Advance case to Lab Submitted if caseId provided
    if (data.caseId) {
      const caseRec = store.getById('cases', data.caseId);
      if (caseRec && caseRec.stage === 'Sample Collected') {
        store.update('cases', data.caseId, { stage: 'Lab Submitted', sampleId: sample.id });
      }
    }
    store.audit('SAMPLE_ADDED', sample.id, userId, `Sample ${sample.id} added for ${data.animalId}`);
    return sample;
  },

  updateResult(id, result, labNotes, userId) {
    const updated = store.update('labSamples', id, {
      result,
      labNotes: labNotes || '',
      resultDate: new Date().toISOString().split('T')[0],
    });
    // Advance case stage
    const sample = store.getById('labSamples', id);
    if (sample?.caseId) {
      store.update('cases', sample.caseId, {
        stage: 'Confirmed / Rejected',
        labResult: result,
        labResultDate: new Date().toISOString().split('T')[0],
      });
    }
    store.audit('LAB_RESULT_ENTERED', id, userId, `Sample ${id} result: ${result}`);
    return updated;
  },

  getPendingCount() {
    return store.query('labSamples', s => s.result === 'Pending').length;
  },

  getTurnaroundDays(sample) {
    if (!sample.submittedDate) return null;
    const submitted = new Date(sample.submittedDate);
    const resolved  = sample.resultDate ? new Date(sample.resultDate) : new Date();
    return Math.round((resolved - submitted) / 86400000);
  },
};

function enrichSample(s, db) {
  const animal  = db.animals.find(a => a.id === s.animalId) || {};
  const farm    = db.farms.find(f => f.id === animal.farmId) || {};
  const disease = db.diseases.find(d => d.id === s.suspectedDiseaseId) || {};
  return { ...s, animal, farm, disease };
}
