import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, PawPrint, X } from 'lucide-react';
import { RiskBadge, Card, SectionTitle } from '../common/UIComponents';

const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

export default function AnimalsList({ liveData, setPage, role, actions }) {
  const [search, setSearch]         = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterRisk, setFilterRisk]       = useState('');
  const [filterFarm, setFilterFarm]       = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState({ id: '', name: '', speciesId: 'SP_01', breedId: 'BR_01', farmId: 'FARM_A', age: '', sex: 'Female', weight: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [saved, setSaved]           = useState('');

  const animals = useMemo(() => {
    const db = liveData;
    return db.animals.map(a => {
      const species = db.species?.find(s => s.id === a.speciesId) || { name: a.speciesId };
      const breed   = db.breeds?.find(b => b.id === a.breedId)    || { name: a.breedId };
      const farm    = db.farms?.find(f => f.id === a.farmId)       || { name: '—', district: '—' };
      return { ...a, species, breed, farm };
    });
  }, [liveData]);

  const speciesOptions = useMemo(() => [...new Set(animals.map(a => a.species?.name).filter(Boolean))], [animals]);
  const farmOptions    = useMemo(() => liveData.farms || [], [liveData]);

  const filtered = useMemo(() => animals.filter(a => {
    const ev = a.riskEval || {};
    if (filterRisk    && ev.healthRiskLevel !== filterRisk) return false;
    if (filterSpecies && a.species?.name !== filterSpecies) return false;
    if (filterFarm    && a.farmId !== filterFarm)           return false;
    if (search) {
      const q = search.toLowerCase();
      return a.id.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q) ||
             a.species?.name?.toLowerCase().includes(q) || a.breed?.name?.toLowerCase().includes(q) ||
             a.farm?.name?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a,b) => {
    const rank = { CRITICAL:4, RED:3, ORANGE:2, YELLOW:1, GREEN:0 };
    return (rank[b.riskEval?.healthRiskLevel]||0) - (rank[a.riskEval?.healthRiskLevel]||0);
  }), [animals, search, filterRisk, filterSpecies, filterFarm]);

  function handleAddAnimal() {
    const newAnimal = { ...form, age: Number(form.age)||2, weight: Number(form.weight)||0,
      id: form.id || `AN_${Date.now()}`,
      baseline: { activity:88, feeding:86, movement:87, rumination:83 },
      current:  { activity:88, feeding:86, movement:87, rumination:83, tempTrend:'normal', social:'normal' },
    };
    actions.addAnimal(newAnimal);
    setShowAdd(false);
    setForm({ id:'', name:'', speciesId:'SP_01', breedId:'BR_01', farmId:'FARM_A', age:'', sex:'Female', weight:'' });
    setSaved(`Animal ${newAnimal.id} registered!`);
    setTimeout(() => setSaved(''), 3000);
  }

  function goToProfile(id) {
    setSelectedId(id);
    setPage('animal-profile', id);
  }

  const riskCounts = useMemo(() => {
    const counts = { CRITICAL:0, RED:0, ORANGE:0, YELLOW:0, GREEN:0 };
    animals.forEach(a => { const l = a.riskEval?.healthRiskLevel || 'GREEN'; counts[l]++; });
    return counts;
  }, [animals]);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Herd Management" title="Animals Registry">
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">{saved}</span>}
          <button onClick={() => setShowAdd(s => !s)} className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600">
            <Plus size={14} /> Register Animal
          </button>
        </div>
      </SectionTitle>

      {/* Risk summary row */}
      <div className="grid grid-cols-5 gap-2">
        {['CRITICAL','RED','ORANGE','YELLOW','GREEN'].map(l => {
          const labels = { CRITICAL:'Critical', RED:'Alert', ORANGE:'Field Check', YELLOW:'Monitor', GREEN:'Normal' };
          const colors = { CRITICAL:'bg-red-900 text-white', RED:'bg-red-600 text-white', ORANGE:'bg-orange-600 text-white', YELLOW:'bg-amber-500 text-white', GREEN:'bg-emerald-600 text-white' };
          return (
            <button key={l} onClick={() => setFilterRisk(filterRisk === l ? '' : l)}
              className={`rounded-xl p-3 text-center transition-all ${filterRisk === l ? colors[l] + ' ring-2 ring-offset-1 ring-slate-400' : 'bg-white border border-slate-200 text-slate-700'}`}>
              <div className="text-xl font-black">{riskCounts[l]}</div>
              <div className="text-[10px] font-semibold">{labels[l]}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9 w-full`} placeholder="Search by ID, name, species, farm…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={inputCls} value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}>
          <option value="">All Species</option>
          {speciesOptions.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className={inputCls} value={filterFarm} onChange={e => setFilterFarm(e.target.value)}>
          <option value="">All Farms</option>
          {farmOptions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {(filterRisk || filterSpecies || filterFarm || search) && (
          <button onClick={() => { setFilterRisk(''); setFilterSpecies(''); setFilterFarm(''); setSearch(''); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Add Animal Form */}
      {showAdd && (
        <Card className="p-4 border-teal-200">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Register New Animal</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Tag / ID (optional)', key: 'id', type: 'text', placeholder: 'e.g. MH-CAT-099' },
              { label: 'Name', key: 'name', type: 'text', placeholder: 'Animal name' },
              { label: 'Age (years)', key: 'age', type: 'number', placeholder: '2' },
              { label: 'Weight (kg)', key: 'weight', type: 'number', placeholder: '300' },
            ].map(f => (
              <label key={f.key} className="block">
                <span className="text-xs font-semibold text-slate-600 block mb-1">{f.label}</span>
                <input type={f.type} placeholder={f.placeholder} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </label>
            ))}
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Species</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.speciesId} onChange={e => setForm(p => ({ ...p, speciesId: e.target.value }))}>
                {(liveData.species || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Breed</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.breedId} onChange={e => setForm(p => ({ ...p, breedId: e.target.value }))}>
                {(liveData.breeds || []).filter(b => b.speciesId === form.speciesId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Farm</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.farmId} onChange={e => setForm(p => ({ ...p, farmId: e.target.value }))}>
                {(liveData.farms || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Sex</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))}>
                <option>Female</option><option>Male</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddAnimal} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">Register</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">ID / Name</th>
              <th className="px-4 py-3">Species · Breed</th>
              <th className="px-4 py-3">Farm · District</th>
              <th className="px-4 py-3 text-center">Age · Sex</th>
              <th className="px-4 py-3 text-center">Activity</th>
              <th className="px-4 py-3 text-center">Temp</th>
              <th className="px-4 py-3">Risk Level</th>
              <th className="px-4 py-3">Last Obs.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-400"><PawPrint size={28} className="mx-auto mb-2 text-slate-300" /><p>No animals match your filters.</p></td></tr>
            )}
            {filtered.map(a => {
              const ev = a.riskEval || {};
              const actDrop = a.baseline?.activity > 0 ? Math.round(((a.baseline.activity - a.current.activity) / a.baseline.activity) * 100) : 0;
              return (
                <tr key={a.id} onClick={() => goToProfile(a.id)}
                  className="hover:bg-teal-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-teal-800 text-xs">{a.id}</div>
                    <div className="text-slate-700">{a.name || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{a.species?.name} · <span className="text-slate-500">{a.breed?.name}</span></td>
                  <td className="px-4 py-3 text-slate-700">{a.farm?.name} · <span className="text-slate-500">{a.farm?.district}</span></td>
                  <td className="px-4 py-3 text-center text-slate-600">{a.age}y · {a.sex}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${actDrop >= 25 ? 'text-red-600' : actDrop >= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {a.current?.activity}% {actDrop > 0 && <span className="text-[10px]">▼{actDrop}%</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold ${a.current?.tempTrend === 'elevated' ? 'text-red-600' : 'text-slate-500'}`}>
                      {a.current?.tempTrend === 'elevated' ? '🌡 ↑' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={ev.healthRiskLevel || 'GREEN'} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {a.lastObservation ? new Date(a.lastObservation).toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' }) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
          Showing {filtered.length} of {animals.length} animals
        </div>
      </Card>
    </div>
  );
}
