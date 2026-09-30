import React, { useState, useEffect } from 'react';
import { Send, PawPrint, ChevronDown, Camera, Cpu, Activity } from 'lucide-react';
import { Card, SectionTitle } from '../common/UIComponents';
import { api } from '../../services/api/api';

const SYMPTOMS = [
  'Not eating / low appetite', 'Limping / difficulty walking', 'Swollen body part',
  'Runny nose / eye discharge', 'Diarrhoea / loose stool', 'High temperature (feels hot)',
  'Lying down / not standing up', 'Skin lumps or sores', 'Aborted / lost calf/kid',
  'Reddish/dark urine', 'Sudden change in behaviour', 'Drooling excessively',
];

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

export default function ReportHealthIssue({ offlineMode, role, setPage }) {
  const [form, setForm] = useState({
    animalId: '', symptoms: [], notes: '', severity: 'Mild',
    hasCamera: false, hasIoT: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedObs, setSubmittedObs] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isDirty = form.animalId !== '' || form.symptoms.length > 0 || form.notes !== '' || form.hasCamera || form.hasIoT;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      const res = await api.animals.getAll();
      if (res.success) {
        setAnimals(res.data);
      } else {
        setError(res.error || 'Failed to load animals');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  function toggleSymptom(s) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s],
    }));
  }

  async function submit() {
    if (!form.animalId) return;
    setSubmitting(true);
    
    // Convert symptoms + notes into a single notes field for the backend, since backend observation model might not have symptoms array natively
    const fullNotes = `Symptoms: ${form.symptoms.join(', ')}\nNotes: ${form.notes}`;
    
    // To trigger the Golden Demo Intelligence properly, we simulate the drop in telemetry here 
    // since we don't have real IoT hardware attached to the frontend form.
    const obs = {
      animalId: form.animalId,
      notes: fullNotes,
      activityLevel: form.symptoms.includes('Lying down / not standing up') ? 10 : undefined,
      feedingMinutes: form.symptoms.includes('Not eating / low appetite') ? 20 : undefined,
      temperatureCelsius: form.symptoms.includes('High temperature (feels hot)') ? 40.5 : undefined,
      dataSource: form.hasIoT ? 'SIMULATED_IOT' : 'FARMER_OBSERVATION',
    };
    
    const res = await api.observations.create(obs);
    setSubmitting(false);
    
    if (res.success) {
      setSubmittedObs({ animalId: form.animalId });
      setSubmitted(true);
    } else {
      alert(`Submission failed: ${res.error}`);
    }
  }

  function handleBack() {
    if (isDirty && !submitted) {
      setShowConfirm(true);
    } else {
      setPage('dashboard');
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <SectionTitle eyebrow="Farmer Portal" title="Report a Health Issue" />
        <Card className="p-12 text-center text-slate-500 flex flex-col items-center">
          <Activity className="animate-spin mb-4 text-teal-600" size={32} />
          <p className="font-semibold text-sm">Loading authoritative data...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <SectionTitle eyebrow="Farmer Portal" title="Report a Health Issue" />
        <Card className="p-8 text-center bg-red-50 border-red-200">
          <h3 className="text-red-800 font-bold mb-2">Backend Connection Failed</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Report Submitted to Backend</h2>
        <p className="text-slate-600 mb-2">Your report for <strong>{submittedObs?.animalId}</strong> has been saved.</p>
        <div className="text-sm text-slate-500 mb-4">The authoritative brain will re-calculate risk and notify a veterinarian if a threshold is crossed.</div>
        <button onClick={() => { setSubmitted(false); setForm({ animalId:'', symptoms:[], notes:'', severity:'Mild', hasCamera:false, hasIoT:false }); }}
          className="rounded-lg bg-teal-700 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-600">
          Report Another Issue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto relative">
      <SectionTitle 
        eyebrow="Farmer Portal" 
        title="Report a Health Issue" 
        backAction={handleBack} 
        backLabel="Back to Dashboard" 
      />

      {showConfirm && (
        <div className="absolute top-0 left-0 w-full z-50">
          <Card className="p-5 border-amber-200 bg-amber-50 shadow-lg text-center animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-amber-900 font-bold mb-1 text-[16px]">Leave this page?</h3>
            <p className="text-amber-700 text-[14px] mb-4">You have unsaved information.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition-colors"
              >
                Continue Editing
              </button>
              <button 
                onClick={() => setPage('dashboard')} 
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-[13px] hover:bg-red-700 transition-colors shadow-sm"
              >
                Leave Page
              </button>
            </div>
          </Card>
        </div>
      )}

      {offlineMode && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800">
          📡 Offline mode — API connectivity is required.
        </div>
      )}

      <Card className="p-3.5 sm:p-5 space-y-4">
        {/* Animal selection */}
        <label className="block">
          <span className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5">1. Which animal? <span className="text-red-500">*</span></span>
          <select className={`${inputCls} min-h-[42px]`} value={form.animalId} onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))}>
            <option value="">— Select your animal —</option>
            {animals.map(a => {
              const farmName = a.farm?.name || a.farmId;
              const speciesName = a.species?.name || 'Unknown Species';
              return <option key={a.id} value={a.id}>{a.tagId || a.id} ({speciesName} · {farmName})</option>;
            })}
          </select>
        </label>

        {/* Symptom checkboxes */}
        <div>
          <span className="text-xs sm:text-sm font-bold text-slate-700 block mb-2">2. What are you noticing?</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {SYMPTOMS.map(s => (
              <label key={s} className={`flex items-center gap-2.5 rounded-lg border p-2.5 sm:p-3 cursor-pointer transition-colors text-xs min-h-[42px] ${form.symptoms.includes(s) ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-teal-200'}`}>
                <input type="checkbox" className="accent-teal-600 w-4 h-4 shrink-0 rounded" checked={form.symptoms.includes(s)} onChange={() => toggleSymptom(s)} />
                <span className="leading-snug">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <span className="text-xs sm:text-sm font-bold text-slate-700 block mb-2">3. How serious does it look?</span>
          <div className="flex gap-2 sm:gap-3">
            {['Mild','Moderate','Severe'].map(s => (
              <label key={s} className={`flex-1 text-center rounded-lg border p-2.5 sm:p-3 cursor-pointer text-xs sm:text-sm font-semibold min-h-[44px] flex items-center justify-center transition-colors ${form.severity === s ? (s === 'Severe' ? 'bg-red-100 border-red-400 text-red-900' : s === 'Moderate' ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-emerald-100 border-emerald-400 text-emerald-900') : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200'}`}>
                <input type="radio" name="severity" className="sr-only" checked={form.severity === s} onChange={() => setForm(f => ({ ...f, severity: s }))} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <label className="block">
          <span className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5">4. Any other details?</span>
          <textarea className={inputCls} rows={3} placeholder="Describe what you saw in your own words…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </label>

        {/* Data sources */}
        <div>
          <span className="text-xs sm:text-sm font-bold text-slate-700 block mb-2">5. Data sources (optional)</span>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <label className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-xs font-semibold min-h-[40px] ${form.hasCamera ? 'bg-purple-50 border-purple-400 text-purple-800' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type="checkbox" className="accent-purple-600 w-4 h-4 rounded shrink-0" checked={form.hasCamera} onChange={e => setForm(f => ({ ...f, hasCamera: e.target.checked }))} />
              <Camera size={14} className="shrink-0" /> <span>Camera observation</span>
            </label>
            <label className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-xs font-semibold min-h-[40px] ${form.hasIoT ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-slate-200 text-slate-600'}`}>
              <input type="checkbox" className="accent-blue-600 w-4 h-4 rounded shrink-0" checked={form.hasIoT} onChange={e => setForm(f => ({ ...f, hasIoT: e.target.checked }))} />
              <Cpu size={14} className="shrink-0" /> <span>Simulated IoT/Sensor triggered</span>
            </label>
          </div>
        </div>

        <button onClick={submit} disabled={!form.animalId || submitting} className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[48px] shadow-sm">
          {submitting ? <Activity className="animate-spin" size={16} /> : <Send size={16} />} 
          {submitting ? 'Submitting to Brain...' : 'Submit Report via API'}
        </button>
      </Card>
    </div>
  );
}
