import React, { useState } from 'react';
import { Send, PawPrint, ChevronDown, Camera, Cpu } from 'lucide-react';
import { Card, SectionTitle } from '../common/UIComponents';

const SYMPTOMS = [
  'Not eating / low appetite', 'Limping / difficulty walking', 'Swollen body part',
  'Runny nose / eye discharge', 'Diarrhoea / loose stool', 'High temperature (feels hot)',
  'Lying down / not standing up', 'Skin lumps or sores', 'Aborted / lost calf/kid',
  'Reddish/dark urine', 'Sudden change in behaviour', 'Drooling excessively',
];

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

export default function ReportHealthIssue({ liveData, actions, offlineMode, role }) {
  const [form, setForm] = useState({
    animalId: '', symptoms: [], notes: '', severity: 'Mild',
    hasCamera: false, hasIoT: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedObs, setSubmittedObs] = useState(null);

  const myFarmId = role === 'farmer' ? (liveData.users?.find(u => u.role === 'farmer')?.farmId || null) : null;
  const myAnimals = myFarmId
    ? (liveData.animals || []).filter(a => a.farmId === myFarmId)
    : (liveData.animals || []);

  function toggleSymptom(s) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s],
    }));
  }

  function submit() {
    if (!form.animalId) return;
    const obs = {
      animalId: form.animalId,
      symptoms: form.symptoms,
      notes: form.notes,
      severity: form.severity,
      cameraSource: form.hasCamera,
      iotSource: form.hasIoT,
      reportedBy: 'Current User',
      reporterRole: role || 'farmer',
    };
    actions.addReport(obs);
    setSubmittedObs(obs);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Report Submitted</h2>
        <p className="text-slate-600 mb-2">Your report for <strong>{submittedObs?.animalId}</strong> has been {offlineMode ? 'queued for sync (offline mode)' : 'saved'}.</p>
        {offlineMode && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800 mb-4">
            📡 Offline mode — this report will sync when connectivity is restored.
          </div>
        )}
        <div className="text-sm text-slate-500 mb-4">A veterinarian will be notified if a risk threshold is crossed.</div>
        <button onClick={() => { setSubmitted(false); setForm({ animalId:'', symptoms:[], notes:'', severity:'Mild', hasCamera:false, hasIoT:false }); }}
          className="rounded-lg bg-teal-700 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-600">
          Report Another Issue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <SectionTitle eyebrow="Farmer Portal" title="Report a Health Issue" />

      {offlineMode && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800">
          📡 Offline mode — reports will be queued and synced when connectivity is restored.
        </div>
      )}

      <Card className="p-5 space-y-4">
        {/* Animal selection */}
        <label className="block">
          <span className="text-sm font-bold text-slate-700 block mb-1">1. Which animal? <span className="text-red-500">*</span></span>
          <select className={inputCls} value={form.animalId} onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))}>
            <option value="">— Select your animal —</option>
            {myAnimals.map(a => {
              const species = (liveData.species || []).find(s => s.id === a.speciesId);
              const farm    = (liveData.farms || []).find(f => f.id === a.farmId);
              return <option key={a.id} value={a.id}>{a.name || a.id} ({species?.name} · {farm?.name})</option>;
            })}
          </select>
        </label>

        {/* Symptom checkboxes */}
        <div>
          <span className="text-sm font-bold text-slate-700 block mb-2">2. What are you noticing?</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SYMPTOMS.map(s => (
              <label key={s} className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors text-xs ${form.symptoms.includes(s) ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-teal-200'}`}>
                <input type="checkbox" className="mt-0.5 accent-teal-600" checked={form.symptoms.includes(s)} onChange={() => toggleSymptom(s)} />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <span className="text-sm font-bold text-slate-700 block mb-2">3. How serious does it look?</span>
          <div className="flex gap-3">
            {['Mild','Moderate','Severe'].map(s => (
              <label key={s} className={`flex-1 text-center rounded-lg border p-3 cursor-pointer text-sm font-semibold ${form.severity === s ? (s === 'Severe' ? 'bg-red-100 border-red-400 text-red-900' : s === 'Moderate' ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-emerald-100 border-emerald-400 text-emerald-900') : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200'}`}>
                <input type="radio" name="severity" className="sr-only" checked={form.severity === s} onChange={() => setForm(f => ({ ...f, severity: s }))} />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <label className="block">
          <span className="text-sm font-bold text-slate-700 block mb-1">4. Any other details?</span>
          <textarea className={inputCls} rows={3} placeholder="Describe what you saw in your own words…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </label>

        {/* Data sources */}
        <div>
          <span className="text-sm font-bold text-slate-700 block mb-2">5. Data sources (optional)</span>
          <div className="flex gap-3">
            <label className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-xs font-semibold ${form.hasCamera ? 'bg-purple-50 border-purple-400 text-purple-800' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type="checkbox" className="accent-purple-600" checked={form.hasCamera} onChange={e => setForm(f => ({ ...f, hasCamera: e.target.checked }))} />
              <Camera size={13} /> Camera observation
            </label>
            <label className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-xs font-semibold ${form.hasIoT ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type="checkbox" className="accent-blue-600" checked={form.hasIoT} onChange={e => setForm(f => ({ ...f, hasIoT: e.target.checked }))} />
              <Cpu size={13} /> IoT/Sensor triggered
            </label>
          </div>
        </div>

        <button onClick={submit} disabled={!form.animalId} className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed">
          <Send size={16} /> Submit Report
        </button>
      </Card>
    </div>
  );
}
