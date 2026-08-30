import React, { useState, useMemo } from 'react';
import { FlaskConical, Plus, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { Card, SectionTitle } from '../common/UIComponents';
import { LAB_TESTS, SAMPLE_TYPES, LABS } from '../../services/labService';

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

const RESULT_STYLE = {
  Pending:      'bg-slate-100 text-slate-700',
  Positive:     'bg-red-100 text-red-800',
  Negative:     'bg-emerald-100 text-emerald-800',
  Inconclusive: 'bg-amber-100 text-amber-800',
};

export default function LaboratoryModule({ liveData, addLabSample, updateLabResult }) {
  const [showAdd, setShowAdd]     = useState(false);
  const [filterResult, setFilterResult] = useState('');
  const [search, setSearch]       = useState('');
  const [resultEntry, setResultEntry] = useState({});  // { sampleId: { result, notes } }
  const [form, setForm]           = useState({ animalId: '', caseId: '', sampleType: 'Blood / Serum', test: 'RT-PCR', laboratory: LABS[0], suspectedDiseaseId: '' });
  const [saved, setSaved]         = useState('');

  const samples = useMemo(() => {
    const db = liveData;
    return (db.labSamples || []).map(s => {
      const animal  = db.animals?.find(a => a.id === s.animalId) || {};
      const farm    = db.farms?.find(f => f.id === animal.farmId) || {};
      const disease = db.diseases?.find(d => d.id === s.suspectedDiseaseId) || {};
      const caseRec = db.cases?.find(c => c.id === s.caseId) || {};
      const days    = s.submittedDate ? Math.round((Date.now() - new Date(s.submittedDate).getTime()) / 86400000) : null;
      return { ...s, animal, farm, disease, caseRec, daysPending: days };
    }).sort((a,b) => new Date(b.collectionDate || 0) - new Date(a.collectionDate || 0));
  }, [liveData]);

  const filtered = samples.filter(s => {
    if (filterResult && s.result !== filterResult) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.id?.toLowerCase().includes(q) || s.animalId?.toLowerCase().includes(q) || s.disease?.shortName?.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total:       samples.length,
    pending:     samples.filter(s => s.result === 'Pending').length,
    positive:    samples.filter(s => s.result === 'Positive').length,
    negative:    samples.filter(s => s.result === 'Negative').length,
    inconclusive:samples.filter(s => s.result === 'Inconclusive').length,
  };

  function submitSample() {
    addLabSample({ ...form, id: `SMP_${Date.now()}` });
    setShowAdd(false);
    setForm({ animalId:'', caseId:'', sampleType:'Blood / Serum', test:'RT-PCR', laboratory: LABS[0], suspectedDiseaseId:'' });
    setSaved('Sample logged!'); setTimeout(() => setSaved(''), 2500);
  }

  function submitResult(sampleId) {
    const entry = resultEntry[sampleId] || {};
    if (!entry.result || entry.result === 'Pending') return;
    updateLabResult(sampleId, entry.result, entry.notes || '');
    setSaved(`Result recorded: ${entry.result}`); setTimeout(() => setSaved(''), 2500);
    setResultEntry(r => { const n = { ...r }; delete n[sampleId]; return n; });
  }

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Diagnostics" title="Laboratory Workflow">
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">{saved}</span>}
          <button onClick={() => setShowAdd(s => !s)} className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600">
            <Plus size={14} /> Log Sample
          </button>
        </div>
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Samples', value: stats.total,       color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Pending',       value: stats.pending,     color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Positive',      value: stats.positive,    color: 'text-red-800',   bg: 'bg-red-50 border-red-200' },
          { label: 'Negative',      value: stats.negative,    color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Inconclusive',  value: stats.inconclusive,color: 'text-orange-800', bg: 'bg-orange-50 border-orange-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Sample Form */}
      {showAdd && (
        <Card className="p-4 border-teal-200">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Log New Sample</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Animal ID</span>
              <select className={inputCls} value={form.animalId} onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))}>
                <option value="">— Select Animal —</option>
                {(liveData.animals || []).map(a => <option key={a.id} value={a.id}>{a.id} ({a.speciesId})</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Case (optional)</span>
              <select className={inputCls} value={form.caseId} onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))}>
                <option value="">— No linked case —</option>
                {(liveData.cases || []).filter(c => c.stage !== 'Closed').map(c => <option key={c.id} value={c.id}>{c.id} ({c.animalId})</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Sample Type</span>
              <select className={inputCls} value={form.sampleType} onChange={e => setForm(f => ({ ...f, sampleType: e.target.value }))}>
                {SAMPLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Lab Test</span>
              <select className={inputCls} value={form.test} onChange={e => setForm(f => ({ ...f, test: e.target.value }))}>
                {LAB_TESTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Laboratory</span>
              <select className={inputCls} value={form.laboratory} onChange={e => setForm(f => ({ ...f, laboratory: e.target.value }))}>
                {LABS.map(l => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Suspected Disease</span>
              <select className={inputCls} value={form.suspectedDiseaseId} onChange={e => setForm(f => ({ ...f, suspectedDiseaseId: e.target.value }))}>
                <option value="">— None —</option>
                {(liveData.diseases || []).map(d => <option key={d.id} value={d.id}>{d.shortName} — {d.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={submitSample} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">Log Sample</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="pl-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none" placeholder="Search by ID, animal, disease…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={filterResult} onChange={e => setFilterResult(e.target.value)}>
          <option value="">All Results</option><option>Pending</option><option>Positive</option><option>Negative</option><option>Inconclusive</option>
        </select>
      </div>

      {/* Samples table */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Sample ID</th><th className="px-4 py-3">Animal</th>
              <th className="px-4 py-3">Disease</th><th className="px-4 py-3">Sample Type</th>
              <th className="px-4 py-3">Test</th><th className="px-4 py-3">Lab</th>
              <th className="px-4 py-3">Days</th><th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr><td colSpan="9" className="px-4 py-10 text-center text-slate-400"><FlaskConical size={28} className="mx-auto mb-2" /><p>No samples found.</p></td></tr>
            )}
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-teal-800 font-bold">{s.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{s.animalId}<div className="text-xs text-slate-400">{s.farm?.district}</div></td>
                <td className="px-4 py-3 text-slate-600 text-xs">{s.disease?.shortName || '—'}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{s.sampleType}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{s.test}</td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{s.laboratory}</td>
                <td className="px-4 py-3 text-center">
                  {s.result === 'Pending' && s.daysPending != null ? (
                    <span className={`text-xs font-bold ${s.daysPending > 3 ? 'text-red-600' : 'text-amber-600'}`}>{s.daysPending}d</span>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_STYLE[s.result] || 'bg-slate-100 text-slate-600'}`}>{s.result}</span>
                </td>
                <td className="px-4 py-3">
                  {s.result === 'Pending' && (
                    <div className="flex gap-1 items-center">
                      <select className="text-xs border border-slate-200 rounded px-1 py-0.5" value={resultEntry[s.id]?.result || ''} onChange={e => setResultEntry(r => ({ ...r, [s.id]: { ...r[s.id], result: e.target.value } }))}>
                        <option value="">Result</option><option>Positive</option><option>Negative</option><option>Inconclusive</option>
                      </select>
                      <button onClick={() => submitResult(s.id)} className="text-xs font-bold bg-teal-700 text-white px-2 py-0.5 rounded hover:bg-teal-600">Save</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
