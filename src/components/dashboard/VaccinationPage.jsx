import React, { useState, useEffect } from 'react';
import { Syringe, Plus, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, SectionTitle, StatCard } from '../common/UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../../services/api/api';

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

export default function VaccinationPage({ role }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ animalId:'', vaccineId:'', vaccineName:'', date: new Date().toISOString().split('T')[0], nextDue:'', batchNo:'', administeredBy:'' });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, overdueAnimalsCount: 0, byDistrict: [], byDisease: [] });
  const [reference, setReference] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [refRes, statsRes, recordsRes] = await Promise.all([
        api.vaccination.getReference(),
        api.vaccination.getStats(),
        api.vaccination.getRecords({ page: 1, pageSize: 100 }) // fetching first 100 for display
      ]);
      setReference(refRes.data || []);
      setStats(statsRes.data || { totalRecords: 0, overdueAnimalsCount: 0, byDistrict: [], byDisease: [] });
      setRecords(recordsRes.data || []);
    } catch (err) {
      console.error('Vaccination fetch failed', err);
      setError('Failed to load vaccination data. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function submit() {
    setError('');
    try {
      await api.vaccination.create({ animalId: form.animalId, vaccineId: form.vaccineId, vaccineName: form.vaccineName, administeredAt: new Date(form.date).toISOString(), nextDueDate: form.nextDue ? new Date(form.nextDue).toISOString() : null, batchNumber: form.batchNo, administeredBy: form.administeredBy });
      setShowAdd(false);
      setForm({ animalId:'', vaccineId:'', vaccineName:'', date: new Date().toISOString().split('T')[0], nextDue:'', batchNo:'', administeredBy:'' });
      setSaved('Vaccination recorded successfully.');
      setTimeout(() => setSaved(''), 2500);
      fetchData(); // reload
    } catch (err) {
      setError(err.message || 'Failed to record vaccination');
    }
  }

  if (loading && records.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Vaccination Records...</div>;
  }

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Herd Immunity" title="Vaccination Coverage & Records">
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">{saved}</span>}
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowAdd(s => !s)} className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600">
            <Plus size={14} /> Add Record
          </button>
        </div>
      </SectionTitle>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Vaccination Records" value={stats.totalRecords} icon={Syringe} tone="teal" />
        <StatCard label="Overdue Animals"    value={stats.overdueAnimalsCount}   icon={AlertTriangle} tone="red" />
        <StatCard label="Districts Tracked"  value={stats.byDistrict?.length || 0} icon={TrendingUp}   tone="slate" />
        <StatCard label="Diseases Covered"   value={stats.byDisease?.length || 0}  icon={CheckCircle2} tone="emerald" />
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="p-4 border-teal-200">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">New Vaccination Record</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Animal ID</span>
              <input className={inputCls} value={form.animalId} onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))} placeholder="UUID" />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Vaccine Reference</span>
              <select className={inputCls} value={form.vaccineId} onChange={e => {
                const v = reference.find(r => r.id === e.target.value);
                setForm(f => ({ ...f, vaccineId: e.target.value, vaccineName: v ? v.name : f.vaccineName }));
              }}>
                <option value="">— Select Reference (Optional) —</option>
                {reference.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Vaccine Name</span>
              <input className={inputCls} value={form.vaccineName} onChange={e => setForm(f => ({ ...f, vaccineName: e.target.value }))} placeholder="e.g. FMD Bivalent" />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Date Given</span>
              <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Next Due</span>
              <input type="date" className={inputCls} value={form.nextDue} onChange={e => setForm(f => ({ ...f, nextDue: e.target.value }))} />
            </label>
            <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Batch No.</span>
              <input className={inputCls} value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))} />
            </label>
            <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-600 block mb-1">Administered By</span>
              <input className={inputCls} value={form.administeredBy} onChange={e => setForm(f => ({ ...f, administeredBy: e.target.value }))} />
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={submit} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">Save</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* District coverage chart */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Coverage by District (%)</h3>
          {stats.byDistrict?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byDistrict} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0,100]} tick={{ fontSize:11 }} />
                <YAxis dataKey="district" type="category" tick={{ fontSize:11 }} width={100} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="coverage" radius={[0,4,4,0]}>
                  {stats.byDistrict.map((d,i) => <Cell key={i} fill={d.coverage >= 70 ? '#059669' : d.coverage >= 40 ? '#d97706' : '#dc2626'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm py-8 text-center">No data.</p>}
        </Card>

        {/* Disease coverage */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Coverage by Disease</h3>
          <div className="space-y-3">
            {stats.byDisease?.length === 0 && <p className="text-slate-400 text-sm py-8 text-center">No data.</p>}
            {stats.byDisease?.map(r => (
              <div key={r.disease}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{r.disease}</span>
                  <span className={`font-bold ${r.coverage >= 70 ? 'text-emerald-600' : r.coverage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{r.coverage}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${r.coverage >= 70 ? 'bg-emerald-500' : r.coverage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.coverage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Records table */}
      <Card className="overflow-x-auto p-0">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Recent Vaccination Records ({records.length})</h3>
        </div>
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Animal</th><th className="px-4 py-3">Vaccine</th>
              <th className="px-4 py-3">Date Given</th>
              <th className="px-4 py-3">Next Due</th><th className="px-4 py-3">Administered By</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">No vaccination records found.</td></tr>
            )}
            {records.map(v => {
              const nd = v.nextDueDate ? v.nextDueDate.split('T')[0] : null;
              const dt = v.administeredAt ? v.administeredAt.split('T')[0] : null;
              const status = !nd ? 'Current' : nd < today ? 'Overdue' : 'Current';
              return (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-teal-800 text-xs">{v.animalId}</td>
                  <td className="px-4 py-3 text-slate-800">{v.vaccineName}</td>
                  <td className="px-4 py-3 text-slate-600">{dt}</td>
                  <td className="px-4 py-3 text-slate-600">{nd || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{v.administeredBy || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
