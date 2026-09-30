import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  PawPrint, Thermometer, Activity, AlertTriangle, Syringe, FlaskConical,
  ClipboardList, Network, TrendingDown, TrendingUp, CheckCircle2, XCircle,
  ChevronLeft, Info, Camera, Cpu, Users, Footprints, Eye, Plus, Shield, MapPin,
} from 'lucide-react';
import { RiskBadge, Card, SectionTitle, StatCard } from '../common/UIComponents';
import { build7DayHistory } from '../../engine/baselineEngine';
import { api } from '../../services/api/api';

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

function SourceIcon({ type }) {
  const icons = { iot: <Cpu size={13} className="text-blue-500" />, camera: <Camera size={13} className="text-purple-500" />, clinical: <Eye size={13} className="text-amber-500" />, behavior: <Users size={13} className="text-rose-500" />, epidemiological: <Network size={13} className="text-teal-500" />, farmer: <PawPrint size={13} className="text-green-500" /> };
  return icons[type] || <Info size={13} className="text-slate-400" />;
}

function Gauge({ label, value, baseline }) {
  const pct = Math.min(100, Math.max(0, value));
  const drop = baseline > 0 ? Math.round(((baseline - value) / baseline) * 100) : 0;
  const color = drop >= 30 ? 'bg-red-500' : drop >= 15 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className={`font-bold ${drop >= 25 ? 'text-red-600' : drop >= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {value}% {drop > 0 && <span className="text-[10px]">▼{drop}%</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnimalProfile({ liveData, setPage, animalId, actions, role }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showObsForm, setShowObsForm] = useState(false);
  const [showVacForm, setShowVacForm] = useState(false);
  const [obsForm, setObsForm] = useState({ symptoms: [], notes: '', severity: 'Mild' });
  const [vacForm, setVacForm] = useState({ vaccineName: '', diseaseId: '', date: '', nextDue: '', batchNo: '', administeredBy: '' });
  const [saved, setSaved] = useState('');

  const [backendAnimal, setBackendAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnimal() {
      setLoading(true);
      setError(null);
      const res = await api.animals.getById(animalId);
      if (res.success) {
        // Fetch authoritative risk evaluation from backend using resolved UUID
        const riskRes = await api.intelligence.evaluate(res.data.id, {});
        if (riskRes.success) {
          res.data.riskEvaluation = riskRes.data;
          res.data.riskLevel = riskRes.data.riskLevel;
        }
        setBackendAnimal(res.data);
      } else {
        setError(res.error || 'Failed to load animal data');
      }
      setLoading(false);
    }
    if (animalId) fetchAnimal();
    else {
      setError('Invalid animal ID or no animal selected.');
      setLoading(false);
    }
  }, [animalId]);

  const animal = useMemo(() => {
    if (!backendAnimal) return null;
    const a = backendAnimal;
    
    // Resolve name from liveData seed if not on backend model
    const animalInSeed = (liveData.animals || []).find(x => x.tagId === a.tagId || x.id === a.id);
    const animalName = a.name || animalInSeed?.name || null;

    // Normalize farm information (prioritizing real backend DB relations)
    const seedFarm = animalInSeed?.farmId ? (liveData.farms || []).find(f => f.id === animalInSeed.farmId) : null;
    const resolvedFarm = a.farm || seedFarm;
    const farmName = resolvedFarm?.name || (typeof resolvedFarm === 'string' ? resolvedFarm : '—');
    const districtName = resolvedFarm?.district?.name || (typeof resolvedFarm?.district === 'string' ? resolvedFarm.district : (resolvedFarm?.districtName || '—'));
    const latitude = resolvedFarm?.latitude ?? resolvedFarm?.lat ?? null;
    const longitude = resolvedFarm?.longitude ?? resolvedFarm?.lng ?? null;
    const farmObj = resolvedFarm ? { ...resolvedFarm, name: farmName, districtName, latitude, longitude } : null;

    // We mix backend data with legacy liveData for un-migrated tabs
    const vaccinations = (liveData.vaccinations || []).filter(v => v.animalId === a.id);
    const cases = (liveData.cases || []).filter(c => c.animalId === a.id);
    const alerts = (liveData.alerts || []).filter(al => al.animalId === a.id).sort((x,y) => new Date(y.createdAt) - new Date(x.createdAt));
    const labSamples = (liveData.labSamples || []).filter(s => s.animalId === a.id);
    const exposures = (liveData.exposureEvents || []).filter(e => e.sourceId === a.id || e.targetId === a.id);
    
    // The backend provides observations, so we use those
    const observations = (a.observations || []).sort((x,y) => new Date(y.timestamp) - new Date(x.timestamp));
    
    // Extract authoritative EventSnapshots from healthEvents
    const snapshots = (a.healthEvents || []).flatMap(he => (he.snapshots || []).map(s => {
      let parsed = null;
      try {
        parsed = typeof s.snapshotJson === 'string' ? JSON.parse(s.snapshotJson) : s.snapshotJson;
      } catch (e) {
        parsed = s.snapshotJson;
      }
      return { ...s, parsed, healthEventSeverity: he.severity, healthEventSummary: he.summary };
    }));

    // History 7d is still generated from observations for the chart
    // We need mock current/baseline if missing from DB for the radar chart
    const current = a.current || { activity: 80, feeding: 80, movement: 80, rumination: 80, tempTrend: 'normal', social: 'normal' };
    const baseline = a.baseline || { activity: 85, feeding: 85, movement: 85, rumination: 85 };
    
    const history7d = build7DayHistory(a, observations);
    return { ...a, name: animalName, farm: farmObj, current, baseline, vaccinations, observations, cases, alerts, labSamples, exposures, history7d, snapshots };
  }, [backendAnimal, liveData]);

  if (loading) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center p-20 text-slate-400">
        <Activity className="animate-spin mb-4 text-teal-600" size={32} />
        <p className="font-semibold text-sm">Connecting to authoritative backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in p-10 mt-10 max-w-lg mx-auto bg-red-50 border border-red-200 rounded-xl text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Activity size={24} />
        </div>
        <h3 className="text-red-800 font-bold mb-2">Backend Connection Failed</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-xs text-red-500 mt-4 font-semibold uppercase tracking-wide">Network Error — Fallback Disabled</p>
        <button onClick={() => setPage('animals')} className="mt-4 text-teal-700 underline text-sm">← Back to list</button>
      </div>
    );
  }

  if (!animal) return (
    <div className="p-8 text-center text-slate-500">
      <PawPrint size={40} className="mx-auto mb-3 text-slate-300" />
      <p>Animal not found.</p>
      <button onClick={() => setPage('animals')} className="mt-3 text-teal-700 underline text-sm">← Back to list</button>
    </div>
  );

  const riskLevel = animal.riskLevel || 'GREEN';
  const RISK = {
    GREEN: '#059669', YELLOW: '#d97706', ORANGE: '#ea580c', RED: '#dc2626', CRITICAL: '#7f1d1d'
  };

  const radarData = [
    { metric: 'Activity',   current: animal.current.activity,   baseline: animal.baseline.activity },
    { metric: 'Feeding',    current: animal.current.feeding,    baseline: animal.baseline.feeding },
    { metric: 'Movement',   current: animal.current.movement,   baseline: animal.baseline.movement },
    { metric: 'Rumination', current: animal.current.rumination, baseline: animal.baseline.rumination },
  ];

  const TABS = [
    { id: 'overview',     label: 'Health Fingerprint'  },
    { id: 'observations', label: `Observations (${animal.observations.length})` },
    { id: 'snapshots',    label: `Event Snapshots (${(animal.snapshots || []).length})` },
    { id: 'risk',         label: 'Risk & Disease' },
    { id: 'history',      label: 'Trend History' },
    { id: 'cases',        label: `Cases (${animal.cases.length})` },
    { id: 'vaccination',  label: `Vaccinations (${animal.vaccinations.length})` },
    { id: 'exposure',     label: `Exposure (${animal.exposures.length})` },
  ];

  async function submitObservation() {
    const data = {
      animalId: animal.id,
      notes: obsForm.notes,
      severity: obsForm.severity
    };
    
    const res = await api.observations.create(data);
    if (res.offline) {
      setObsForm({ symptoms: [], notes: '', severity: 'Mild' });
      setShowObsForm(false);
      setSaved('Saved locally — waiting for sync');
      setTimeout(() => setSaved(''), 2500);
    } else if (res.success) {
      // Re-fetch to update profile
      const updatedAnimal = await api.animals.getById(animal.id);
      if (updatedAnimal.success) setBackendAnimal(updatedAnimal.data);
      
      setObsForm({ symptoms: [], notes: '', severity: 'Mild' });
      setShowObsForm(false);
      setSaved('Synced successfully');
      setTimeout(() => setSaved(''), 2500);
    } else {
      console.error(res.error);
    }
  }

  function submitVaccination() {
    // Legacy
    actions.addVaccination({ ...vacForm, animalId: animal.id });
    setVacForm({ vaccineName: '', diseaseId: '', date: '', nextDue: '', batchNo: '', administeredBy: '' });
    setShowVacForm(false);
    setSaved('Vaccination record saved!');
    setTimeout(() => setSaved(''), 2500);
  }

  function openCase() {
    actions.openCase({ animalId: animal.id, suspectedDiseaseId: null, notes: '' });
    setPage('cases');
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-full overflow-hidden">
      {/* 1. Animal Name / Tag Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <button onClick={() => setPage('animals')} className="mb-1.5 flex items-center gap-1 text-xs sm:text-sm text-teal-700 hover:text-teal-900 font-medium">
            <ChevronLeft size={16} /> Back to Animals
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">
            {animal.name && animal.name !== animal.tagId ? `${animal.name} (${animal.tagId || animal.id.slice(0,8)})` : (animal.tagId || animal.id)}
          </h1>
          <div className="text-xs sm:text-sm text-slate-500 truncate">{animal.species?.name} · {animal.breed?.name} · {animal.farm?.name}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RiskBadge level={riskLevel} size="lg" />
          {saved && <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">{saved}</span>}
        </div>
      </div>

      {/* 2. Farm + Location Section */}
      <Card className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5 mb-1">
              <MapPin size={13} className="text-teal-600 shrink-0" /> Farm Location
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 font-medium">Farm: </span>
                <span className="font-bold text-slate-900">{animal.farm?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">District: </span>
                <span className="font-semibold text-slate-800">{animal.farm?.districtName || animal.farm?.district?.name || animal.farm?.district || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Location: </span>
                <span className="font-mono font-semibold text-slate-700">
                  {animal.farm?.latitude != null && animal.farm?.longitude != null
                    ? `${Math.abs(animal.farm.latitude).toFixed(4)}° N, ${Math.abs(animal.farm.longitude).toFixed(4)}° E`
                    : 'Coordinates unavailable'}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => {
                const targetParam = animal.tagId || animal.id;
                setPage('gis', targetParam);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50 border border-teal-200 hover:border-teal-300 px-3.5 py-2 rounded-lg shadow-xs transition-all min-h-[38px]"
            >
              <span>📍 View Location on Map</span>
              <span className="text-teal-600 font-bold">→</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Identification row */}
      <Card className="p-3.5 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 text-xs sm:text-sm">
          <div><div className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Tag / ID</div><div className="font-bold text-teal-800 truncate">{animal.tagId || animal.id.slice(0,8)}</div></div>
          <div><div className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Age</div><div className="font-semibold">{animal.ageMonths ? Math.round(animal.ageMonths/12) : 2} yrs</div></div>
          <div><div className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Sex</div><div className="font-semibold">{animal.gender}</div></div>
          <div><div className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Weight</div><div className="font-semibold">{animal.weightKg ? `${animal.weightKg} kg` : '—'}</div></div>
          <div><div className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Farm</div><div className="font-semibold truncate">{animal.farm?.name || animal.farmId || '—'}</div></div>
          <div><div className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Last Obs.</div><div className="font-semibold text-slate-600 truncate">{animal.observations?.[0]?.timestamp ? new Date(animal.observations[0].timestamp).toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' }) : '—'}</div></div>
        </div>
      </Card>

      {/* 4. Action buttons - Wrap cleanly */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowObsForm(true)} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-teal-600 transition-colors shadow-xs min-h-[40px]">
          <Plus size={15} /> Add Observation
        </button>
        {(role === 'vet' || role === 'official') && (
          <button onClick={openCase} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-red-500 transition-colors shadow-xs min-h-[40px]">
            <ClipboardList size={15} /> Open Case
          </button>
        )}
        <button onClick={() => setShowVacForm(true)} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-600 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors min-h-[40px]">
          <Syringe size={15} /> Add Vaccination
        </button>
      </div>

      {/* Observation form */}
      {showObsForm && (
        <Card className="p-4 border-teal-200">
          <h3 className="font-bold text-slate-800 mb-3">New Observation (API Integrated)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Notes</span>
              <textarea className={inputCls} rows={2} value={obsForm.notes} onChange={e => setObsForm(f => ({ ...f, notes: e.target.value }))} />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Severity</span>
              <select className={inputCls} value={obsForm.severity} onChange={e => setObsForm(f => ({ ...f, severity: e.target.value }))}>
                {['Mild','Moderate','Severe'].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={submitObservation} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">Save via API</button>
            <button onClick={() => setShowObsForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
          </div>
        </Card>
      )}

      {/* Vaccination form */}
      {showVacForm && (
        <Card className="p-4 border-teal-200">
          <h3 className="font-bold text-slate-800 mb-3">Add Vaccination Record</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Vaccine Name</span>
              <input className={inputCls} value={vacForm.vaccineName} onChange={e => setVacForm(f => ({ ...f, vaccineName: e.target.value }))} />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Disease</span>
              <select className={inputCls} value={vacForm.diseaseId} onChange={e => setVacForm(f => ({ ...f, diseaseId: e.target.value }))}>
                <option value="">— Select —</option>
                {(liveData.diseases || []).map(d => <option key={d.id} value={d.id}>{d.shortName} — {d.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Date Given</span>
              <input type="date" className={inputCls} value={vacForm.date} onChange={e => setVacForm(f => ({ ...f, date: e.target.value }))} />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Next Due</span>
              <input type="date" className={inputCls} value={vacForm.nextDue} onChange={e => setVacForm(f => ({ ...f, nextDue: e.target.value }))} />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Batch No.</span>
              <input className={inputCls} value={vacForm.batchNo} onChange={e => setVacForm(f => ({ ...f, batchNo: e.target.value }))} />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Administered By</span>
              <input className={inputCls} value={vacForm.administeredBy} onChange={e => setVacForm(f => ({ ...f, administeredBy: e.target.value }))} />
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={submitVaccination} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">Save</button>
            <button onClick={() => setShowVacForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0 -mx-1 px-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW (HEALTH FINGERPRINT) TAB ───────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {/* Current Readings */}
          <Card className="p-3.5 sm:p-5">
            <h3 className="font-bold text-slate-800 mb-3 text-xs sm:text-sm uppercase tracking-wide">Current vs Baseline</h3>
            <div className="space-y-3 sm:space-y-4">
              <Gauge label="Activity"   value={animal.current.activity}   baseline={animal.baseline.activity} />
              <Gauge label="Feeding"    value={animal.current.feeding}    baseline={animal.baseline.feeding} />
              <Gauge label="Movement"   value={animal.current.movement}   baseline={animal.baseline.movement} />
              <Gauge label="Rumination" value={animal.current.rumination} baseline={animal.baseline.rumination} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
              <div className={`rounded-lg border px-2.5 sm:px-3 py-2 text-xs sm:text-sm ${animal.current.tempTrend === 'elevated' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mb-0.5">Temp Trend</div>
                <div className="font-bold capitalize flex items-center gap-1">
                  <Thermometer size={13} /> {animal.current.tempTrend || 'Normal'}
                </div>
              </div>
              <div className={`rounded-lg border px-2.5 sm:px-3 py-2 text-xs sm:text-sm ${animal.current.social === 'recumbent' ? 'bg-red-100 border-red-300 text-red-900' : animal.current.social === 'isolating' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mb-0.5">Social Behaviour</div>
                <div className="font-bold capitalize flex items-center gap-1">
                  <Users size={13} /> {animal.current.social || 'Normal'}
                </div>
              </div>
            </div>
          </Card>

          {/* Radar */}
          <Card className="p-3.5 sm:p-5">
            <h3 className="font-bold text-slate-800 mb-2 text-xs sm:text-sm uppercase tracking-wide">Behavioural Fingerprint</h3>
            <div className="w-full h-[220px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 15, bottom: 10, left: 15 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#334155' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Baseline" dataKey="baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
                  <Radar name="Current"  dataKey="current"  stroke={RISK[riskLevel]} fill={RISK[riskLevel]} fillOpacity={0.35} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ── RISK & DISEASE TAB ───────────────────────────────────────── */}
      {activeTab === 'risk' && (
        <div className="space-y-3 sm:space-y-4">
          <Card className="p-3.5 sm:p-5">
            <h3 className="font-bold text-slate-800 mb-2 sm:mb-3 text-xs sm:text-sm uppercase tracking-wide">Risk Reasoning</h3>
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-2.5 sm:p-3 text-xs sm:text-sm mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700">Authoritative Risk Level: </span>
              <RiskBadge level={riskLevel} />
              {animal.riskEvaluation && <span className="text-slate-500">Score: {animal.riskEvaluation.riskScore}</span>}
              {animal.riskEvaluation && <span className="text-slate-500">Confidence: {animal.riskEvaluation.confidence}</span>}
            </div>
            
            {animal.riskEvaluation?.reasons?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-slate-800 text-xs sm:text-sm mb-2">Evidence & Reasons</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {animal.riskEvaluation.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-700">
                      <SourceIcon type={r.type} /> <span>{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {animal.riskEvaluation?.diseaseRisks?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-slate-800 text-xs sm:text-sm mb-2">Potential Disease Risk</h4>
                <ul className="space-y-2">
                  {animal.riskEvaluation.diseaseRisks.map((d, i) => (
                    <li key={i} className="text-xs sm:text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <span className="font-bold text-slate-900">{d.name}</span>
                          <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{d.risk} RISK</span>
                        </div>
                        <button 
                          onClick={() => setPage('disease-details', d.diseaseId)}
                          className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold px-2.5 py-1 rounded border border-teal-200 transition-colors whitespace-nowrap"
                        >
                          View Disease →
                        </button>
                      </div>
                      {d.why?.length > 0 && (
                        <ul className="list-disc pl-4 mt-2 text-xs text-slate-500 space-y-0.5">
                          {d.why.map((w, j) => <li key={j}>{w}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {animal.riskEvaluation?.recommendedAction && (
              <div>
                <h4 className="font-semibold text-slate-800 text-xs sm:text-sm mb-1.5">Recommended Action</h4>
                <p className="text-xs sm:text-sm text-slate-700 bg-teal-50 border border-teal-200 p-2.5 sm:p-3 rounded-lg">{animal.riskEvaluation.recommendedAction}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── EVENT SNAPSHOTS TAB ──────────────────────────────────────── */}
      {activeTab === 'snapshots' && (
        <div className="space-y-3 sm:space-y-4">
          {animal.snapshots && animal.snapshots.length > 0 ? (
            animal.snapshots.map(s => {
              const snap = s.parsed || {};
              const evalData = snap.evaluation || snap;
              const reasons = evalData.reasons || [];
              const sev = snap.severity || s.healthEventSeverity || evalData.riskLevel || 'ORANGE';
              return (
                <Card key={s.id} className="p-3.5 sm:p-5 border-l-4 border-l-teal-600 bg-white shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 truncate">
                          {snap.snapshotId || `SNP_${s.id.slice(0, 8)}`}
                        </span>
                        <RiskBadge level={sev} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Persisted At: {new Date(s.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Authoritative Event Snapshot
                    </span>
                  </div>

                  {/* Summary */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Event Snapshot Summary</h4>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200 break-words">
                      {snap.summary || s.healthEventSummary || evalData.explanation?.whyItMatters || 'System risk context captured.'}
                    </p>
                  </div>

                  {/* Telemetry Drops & Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-500">Activity Drop</div>
                      <div className={`text-sm sm:text-base font-extrabold ${(evalData.actDrop || 0) >= 25 ? 'text-red-600' : 'text-slate-800'}`}>
                        {evalData.actDrop || 0}%
                      </div>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-500">Feeding Drop</div>
                      <div className={`text-sm sm:text-base font-extrabold ${(evalData.feedDrop || 0) >= 20 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {evalData.feedDrop || 0}%
                      </div>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-500">Movement Drop</div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-800">
                        {evalData.moveDrop || 0}%
                      </div>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-500">Risk Score</div>
                      <div className="text-sm sm:text-base font-extrabold text-teal-800">
                        {evalData.riskScore || evalData.score || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Reasons & Evidence */}
                  {reasons.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Captured Evidences</h4>
                      <ul className="space-y-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                        {reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0"></span>
                            <span className="break-words">{typeof r === 'string' ? r : r.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Action */}
                  {(evalData.recommendedAction || snap.recommendedAction) && (
                    <div className="text-xs bg-amber-50 border border-amber-200 p-2.5 rounded text-amber-900 break-words">
                      <strong>Recommended Action: </strong>
                      {evalData.recommendedAction || snap.recommendedAction}
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">
              <ClipboardList size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm">No Event Snapshots recorded for this animal</p>
              <p className="text-xs text-slate-400 mt-1">Snapshots are automatically created by the Intelligence Core when risk thresholds are exceeded.</p>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ─────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <Card className="p-3.5 sm:p-5">
          <h3 className="font-bold text-slate-800 mb-3 text-xs sm:text-sm uppercase tracking-wide">7-Day Trend</h3>
          <div className="w-full h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={animal.history7d} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="activity"   stroke="#0d9488" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="feeding"    stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="movement"   stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rumination" stroke="#ec4899" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── VACCINATION TAB ─────────────────────────────────────────── */}
      {activeTab === 'vaccination' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs sm:text-sm text-left min-w-[500px]">
              <thead className="bg-slate-50 text-[11px] sm:text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3">Vaccine</th>
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3">Disease</th>
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3">Date Given</th>
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3">Next Due</th>
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3">Batch No.</th>
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {animal.vaccinations.length ? animal.vaccinations.map(v => {
                  const today = new Date().toISOString().split('T')[0];
                  const status = !v.nextDue ? 'Current' : v.nextDue < today ? 'Overdue' : 'Current';
                  const disease = (liveData.diseases || []).find(d => d.id === v.diseaseId);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-slate-800">{v.vaccineName}</td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-600">{disease?.shortName || v.diseaseId}</td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-600">{v.date}</td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-600">{v.nextDue || '—'}</td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-400 font-mono text-xs">{v.batchNo || '—'}</td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3"><span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{status}</span></td>
                    </tr>
                  );
                }) : <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No vaccination records found.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── CASES TAB ───────────────────────────────────────────────── */}
      {activeTab === 'cases' && (
        <div className="space-y-3">
          {animal.cases.length ? animal.cases.map(c => {
            const disease = (liveData.diseases || []).find(d => d.id === c.suspectedDiseaseId);
            return (
              <Card key={c.id} className="p-3.5 sm:p-4">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm truncate">{c.id}</div>
                    <div className="text-xs text-slate-500">Opened: {new Date(c.openedAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <span className="text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">{c.stage}</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold">Suspected Disease: </span>{disease?.name || c.suspectedDiseaseId || '—'}
                </div>
                {c.clinicalObservations && <div className="mt-1 text-xs text-slate-500 italic break-words">"{c.clinicalObservations.substring(0, 100)}..."</div>}
                {c.labResult && <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-700">Lab Result: <span className={c.labResult === 'Positive' ? 'text-red-700' : 'text-emerald-700'}>{c.labResult}</span></div>}
              </Card>
            );
          }) : <div className="text-center py-8 text-slate-400"><ClipboardList size={32} className="mx-auto mb-2" /><p>No cases recorded.</p></div>}
        </div>
      )}

      {/* ── OBSERVATIONS TAB ─────────────────────────────────────────── */}
      {activeTab === 'observations' && (
        <div className="space-y-3">
          {animal.observations.length ? animal.observations.map(o => (
            <Card key={o.id} className="p-3.5 sm:p-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">{o.reportedBy || o.observerId || 'Unknown'}</span>
                <span>{new Date(o.timestamp).toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 break-words">{o.notes}</p>
              {o.severity && <span className={`mt-1.5 inline-block text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${o.severity === 'Severe' ? 'bg-red-100 text-red-800' : o.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{o.severity}</span>}
            </Card>
          )) : <div className="text-center py-8 text-slate-400"><Eye size={32} className="mx-auto mb-2" /><p>No observations recorded.</p></div>}
        </div>
      )}

      {/* ── EXPOSURE TAB ─────────────────────────────────────────────── */}
      {activeTab === 'exposure' && (
        <div className="space-y-3">
          {animal.exposures.length ? animal.exposures.map(e => {
            const other = e.sourceId === animal.id ? e.targetId : e.sourceId;
            const otherAnimal = (liveData.animals || []).find(a => a.id === other);
            const disease = (liveData.diseases || []).find(d => d.id === e.diseaseId);
            return (
              <Card key={e.id} className={`p-3.5 sm:p-4 border-l-4 ${e.riskLevel === 'HIGH' ? 'border-red-500' : e.riskLevel === 'MEDIUM' ? 'border-amber-500' : 'border-slate-300'}`}>
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{e.sourceId === animal.id ? '→' : '←'} {other}</div>
                    <div className="text-xs text-slate-500 truncate">{otherAnimal ? `${otherAnimal.speciesId} · ${otherAnimal.farmId}` : ''}</div>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${e.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' : e.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{e.riskLevel} RISK</span>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div><span className="text-slate-400">Distance:</span> {e.distance}m</div>
                  <div><span className="text-slate-400">Contacts:</span> {e.contacts}</div>
                  <div><span className="text-slate-400">Disease context:</span> {disease?.shortName || '—'}</div>
                </div>
              </Card>
            );
          }) : <div className="text-center py-8 text-slate-400"><Network size={32} className="mx-auto mb-2" /><p>No exposure events recorded.</p></div>}
        </div>
      )}
    </div>
  );
}
