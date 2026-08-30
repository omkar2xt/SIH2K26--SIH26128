import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, ChevronRight, ClipboardList, FlaskConical, Plus, AlertTriangle, Info } from 'lucide-react';
import { Card, SectionTitle, RiskBadge } from '../common/UIComponents';
import { CASE_STAGES } from '../../services/caseService';

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

const STAGE_COLORS = {
  'New Alert':          'bg-red-100 text-red-800 border-red-200',
  'Accepted':           'bg-amber-100 text-amber-800 border-amber-200',
  'Field Review':       'bg-orange-100 text-orange-800 border-orange-200',
  'Sample Collected':   'bg-blue-100 text-blue-800 border-blue-200',
  'Lab Submitted':      'bg-purple-100 text-purple-800 border-purple-200',
  'Lab Result':         'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Confirmed / Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
  'Action':             'bg-teal-100 text-teal-800 border-teal-200',
  'Follow-up':          'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Closed':             'bg-slate-100 text-slate-600 border-slate-200',
};

export default function VetCaseWorkflow({ liveData, updateCaseStage, actions }) {
  const [selected, setSelected] = useState(null);
  const [filterStage, setFilterStage] = useState('');
  const [obsText, setObsText] = useState('');
  const [sampleForm, setSampleForm] = useState({ sampleType: 'Blood / Serum', laboratory: '', test: 'RT-PCR' });
  const [labResultForm, setLabResultForm] = useState({ result: 'Pending', notes: '' });
  const [actionNote, setActionNote] = useState('');
  const [saved, setSaved] = useState('');

  const cases = useMemo(() => {
    const db = liveData;
    return (db.cases || []).map(c => {
      const animal  = db.animals?.find(a => a.id === c.animalId) || {};
      const disease = db.diseases?.find(d => d.id === c.suspectedDiseaseId) || {};
      const farm    = db.farms?.find(f => f.id === animal.farmId) || {};
      const samples = db.labSamples?.filter(s => s.caseId === c.id) || [];
      return { ...c, animal, disease, farm, samples, stageIndex: CASE_STAGES.indexOf(c.stage) };
    }).sort((a,b) => {
      const rank = { 'New Alert':5,'Accepted':4,'Field Review':3,'Sample Collected':2,'Lab Submitted':2,'Confirmed / Rejected':1,'Action':1,'Follow-up':0,'Closed':-1 };
      return (rank[b.stage]||0) - (rank[a.stage]||0);
    });
  }, [liveData]);

  const filtered = filterStage ? cases.filter(c => c.stage === filterStage) : cases;
  const selCase  = selected ? cases.find(c => c.id === selected) : null;

  function flash(msg) { setSaved(msg); setTimeout(() => setSaved(''), 2500); }

  function advanceStage(caseId, toStage, patch) {
    updateCaseStage(caseId, toStage, patch || {});
    flash(`Stage → ${toStage}`);
    setSelected(caseId); // keep selection
  }

  function recordObs() {
    if (!selCase || !obsText.trim()) return;
    advanceStage(selCase.id, 'Field Review', { clinicalObservations: obsText });
    setObsText('');
  }

  function recordSample() {
    if (!selCase) return;
    actions.addLabSample({
      caseId: selCase.id, animalId: selCase.animalId,
      ...sampleForm,
      suspectedDiseaseId: selCase.suspectedDiseaseId,
      collectedBy: 'Current Vet',
    });
    advanceStage(selCase.id, 'Sample Collected', { ...sampleForm });
    flash('Sample recorded & case advanced to Sample Collected');
  }

  function recordLabResult() {
    if (!selCase) return;
    const sample = selCase.samples?.[0];
    if (sample) actions.updateLabResult(sample.id, labResultForm.result, labResultForm.notes);
    advanceStage(selCase.id, 'Confirmed / Rejected', { labResult: labResultForm.result, labResultDate: new Date().toISOString().split('T')[0] });
    flash(`Lab result recorded: ${labResultForm.result}`);
  }

  function closeCase() {
    if (!selCase) return;
    advanceStage(selCase.id, 'Closed', { outcome: actionNote || 'Case closed.', closedAt: new Date().toISOString() });
    setSelected(null);
  }

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* Case list */}
      <div className="w-72 shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-800 text-sm">Cases ({filtered.length})</h2>
          <select className="text-xs border border-slate-200 rounded px-2 py-1 bg-white" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">All Stages</option>
            {CASE_STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {filtered.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left rounded-xl border p-3 transition-all ${selected === c.id ? 'ring-2 ring-teal-500 border-teal-300 bg-teal-50' : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-slate-50'}`}>
            <div className="flex justify-between items-start gap-1 mb-1">
              <div className="text-xs font-bold text-teal-800">{c.id}</div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${STAGE_COLORS[c.stage] || 'bg-slate-100 text-slate-600'}`}>{c.stage}</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">{c.animalId}</div>
            <div className="text-xs text-slate-500">{c.disease?.shortName || '—'} · {c.farm?.district}</div>
            <div className="text-[10px] text-slate-400 mt-1">{new Date(c.openedAt).toLocaleDateString('en-IN')}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-slate-400"><ClipboardList size={28} className="mx-auto mb-2" /><p className="text-sm">No cases found</p></div>
        )}
      </div>

      {/* Case detail */}
      <div className="flex-1 min-w-0">
        {!selCase && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ClipboardList size={48} className="mb-3 text-slate-300" />
            <p className="font-semibold">Select a case to view details</p>
          </div>
        )}
        {selCase && (
          <div className="space-y-4">
            {saved && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800">{saved}</div>}

            {/* Header */}
            <Card className="p-4">
              <div className="flex flex-wrap justify-between gap-3 items-start">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-0.5">{selCase.id}</div>
                  <h3 className="text-lg font-black text-slate-900">{selCase.animalId}</h3>
                  <div className="text-sm text-slate-500">{selCase.animal?.speciesId} · {selCase.farm?.name} · {selCase.farm?.district}</div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STAGE_COLORS[selCase.stage] || ''}`}>{selCase.stage}</span>
                  <div className="text-xs text-slate-400 mt-1">Opened: {new Date(selCase.openedAt).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-400">Vet: {selCase.assignedVet || '—'}</div>
                </div>
              </div>

              {/* Stage pipeline */}
              <div className="mt-4 overflow-x-auto">
                <div className="flex items-center gap-0 min-w-max">
                  {CASE_STAGES.map((s, i) => {
                    const done    = i < selCase.stageIndex;
                    const current = i === selCase.stageIndex;
                    return (
                      <React.Fragment key={s}>
                        <div className={`flex flex-col items-center ${current ? 'opacity-100' : done ? 'opacity-70' : 'opacity-30'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${current ? 'bg-teal-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {done ? '✓' : i+1}
                          </div>
                          <div className="text-[9px] text-center mt-0.5 w-14 leading-tight text-slate-600">{s}</div>
                        </div>
                        {i < CASE_STAGES.length - 1 && <div className={`h-0.5 w-4 shrink-0 mt-[-12px] ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Suspected disease */}
            {selCase.disease?.id && (
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900 text-sm">Suspected: {selCase.disease.name}</div>
                    <div className="text-xs text-amber-700 mt-0.5">{selCase.disease.pathogen} · {selCase.disease.category}</div>
                    <div className="text-xs text-amber-700 mt-0.5">Diagnostics: {selCase.disease.diagnostics}</div>
                    {selCase.disease.zoonotic && <div className="mt-1 text-xs font-bold text-orange-800 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded inline-block">⚠ ZOONOTIC — human health notification may be required</div>}
                  </div>
                </div>
              </Card>
            )}

            {/* Stage-specific action panels */}

            {/* Accepted → Field Review */}
            {(selCase.stage === 'Accepted') && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Step: Enter Clinical Observations</h4>
                <textarea className={inputCls} rows={3} placeholder="Describe findings: temperature, swellings, discharge, gait, etc." value={obsText} onChange={e => setObsText(e.target.value)} />
                <button onClick={recordObs} className="mt-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">
                  Save Observations & Advance to Field Review
                </button>
              </Card>
            )}

            {/* Field Review → Sample Collected */}
            {selCase.stage === 'Field Review' && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-1">Clinical Observations</h4>
                <p className="text-sm text-slate-700 italic mb-3">{selCase.clinicalObservations || 'Not entered yet.'}</p>
                <h4 className="font-bold text-slate-800 text-sm mb-3">Collect Sample</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Sample Type</span>
                    <select className={inputCls} value={sampleForm.sampleType} onChange={e => setSampleForm(f => ({ ...f, sampleType: e.target.value }))}>
                      {['Blood / Serum','Nasal swab','Vesicular fluid','Epithelial tissue','Urine','Milk','Skin biopsy','Nasal/ocular swab'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Lab Test</span>
                    <select className={inputCls} value={sampleForm.test} onChange={e => setSampleForm(f => ({ ...f, test: e.target.value }))}>
                      {['RT-PCR','ELISA','Bacterial culture & sensitivity','Blood smear (Giemsa)','Serology (IgM ELISA)','PCR','Mallein test','Complement Fixation Test'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Laboratory</span>
                    <select className={inputCls} value={sampleForm.laboratory} onChange={e => setSampleForm(f => ({ ...f, laboratory: e.target.value }))}>
                      <option value="">— Select —</option>
                      {['Regional Disease Diagnostic Laboratory, Pune','Regional Disease Diagnostic Laboratory, Nagpur','State Veterinary Biological & Research Institute, Pune','District Veterinary Laboratory'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </label>
                </div>
                <button onClick={recordSample} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
                  Record Sample Collection
                </button>
              </Card>
            )}

            {/* Lab Submitted → Result */}
            {(selCase.stage === 'Lab Submitted' || selCase.stage === 'Sample Collected') && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Enter Lab Result</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Result</span>
                    <select className={inputCls} value={labResultForm.result} onChange={e => setLabResultForm(f => ({ ...f, result: e.target.value }))}>
                      <option>Pending</option><option>Positive</option><option>Negative</option><option>Inconclusive</option>
                    </select>
                  </label>
                  <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Lab Notes</span>
                    <input className={inputCls} value={labResultForm.notes} onChange={e => setLabResultForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional lab comments" />
                  </label>
                </div>
                <button onClick={recordLabResult} className="mt-3 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600">
                  <FlaskConical size={14} className="inline mr-1.5" />Record Lab Result
                </button>
              </Card>
            )}

            {/* Confirmed/Action → Close */}
            {(selCase.stage === 'Confirmed / Rejected' || selCase.stage === 'Action' || selCase.stage === 'Follow-up') && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-1">Lab Result: <span className={selCase.labResult === 'Positive' ? 'text-red-700' : 'text-emerald-700'}>{selCase.labResult || '—'}</span></h4>
                <h4 className="font-bold text-slate-800 text-sm mb-3 mt-3">Record Action / Close Case</h4>
                <textarea className={inputCls} rows={2} placeholder="Describe actions taken, containment orders, follow-up plan…" value={actionNote} onChange={e => setActionNote(e.target.value)} />
                <div className="flex gap-2 mt-3">
                  {selCase.stage !== 'Action' && (
                    <button onClick={() => advanceStage(selCase.id, 'Action', { action: actionNote })} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">Mark Action Taken</button>
                  )}
                  <button onClick={closeCase} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">Close Case</button>
                </div>
              </Card>
            )}

            {/* Notes */}
            {selCase.notes && (
              <Card className="p-4 bg-slate-50 border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</h4>
                <p className="text-sm text-slate-700">{selCase.notes}</p>
              </Card>
            )}

            {/* Lab samples */}
            {selCase.samples?.length > 0 && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Lab Samples</h4>
                {selCase.samples.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="font-semibold text-slate-800">{s.id}</div>
                      <div className="text-xs text-slate-500">{s.sampleType} · {s.test} · {s.laboratory}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.result === 'Positive' ? 'bg-red-100 text-red-800' : s.result === 'Negative' ? 'bg-emerald-100 text-emerald-800' : s.result === 'Inconclusive' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{s.result}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
