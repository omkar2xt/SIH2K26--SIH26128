import React, { useState, useEffect } from 'react';
import { Syringe, Plus, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, SectionTitle, StatCard } from '../common/UIComponents';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../../services/api/api';

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

const COLORS = {
  'Up to Date': '#10b981', // emerald-500
  'Due Soon': '#f59e0b',   // amber-500
  'Overdue': '#ef4444'     // red-500
};

export default function VaccinationPage({ role, setPage }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ animalId:'', vaccineId:'', vaccineName:'', date: new Date().toISOString().split('T')[0], nextDue:'', batchNo:'', administeredBy:'' });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, overdueAnimalsCount: 0, byDistrict: [], byDisease: [] });
  const [reference, setReference] = useState([]);

  // New states for visualizations
  const [animalCount, setAnimalCount] = useState(0);
  const [donutData, setDonutData] = useState([]);
  const [vaccineStats, setVaccineStats] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [refRes, statsRes, recordsRes, animalsRes] = await Promise.all([
        api.vaccination.getReference(),
        api.vaccination.getStats(),
        api.vaccination.getRecords({ page: 1, pageSize: 100 }), // fetching first 100 for display
        api.animals.getAll()
      ]);
      setReference(refRes.data || []);
      setStats(statsRes.data || { totalRecords: 0, overdueAnimalsCount: 0, byDistrict: [], byDisease: [] });
      
      const recs = recordsRes.data || [];
      setRecords(recs);

      const anims = animalsRes.data || [];
      const totalAnims = anims.length;
      
      let up = 0, due = 0, over = 0;
      const todayDate = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(todayDate.getDate() + 30);
      
      anims.forEach(a => {
        const aRecs = recs.filter(r => r.animalId === a.id);
        if (aRecs.length === 0) {
          over++;
        } else {
          let isOver = false;
          let isDue = false;
          aRecs.forEach(r => {
             if (r.nextDueDate) {
               const nd = new Date(r.nextDueDate);
               if (nd < todayDate) isOver = true;
               else if (nd <= thirtyDays) isDue = true;
             }
          });
          if (isOver) over++;
          else if (isDue) due++;
          else up++;
        }
      });
      
      setDonutData([
        { name: 'Up to Date', value: up, color: COLORS['Up to Date'] },
        { name: 'Due Soon', value: due, color: COLORS['Due Soon'] },
        { name: 'Overdue', value: over, color: COLORS['Overdue'] }
      ]);
      setAnimalCount(totalAnims);

      const vStats = [];
      const uniqueVaccines = [...new Set(recs.map(r => r.vaccineName))];
      uniqueVaccines.forEach(vName => {
        const uAnims = new Set(recs.filter(r => r.vaccineName === vName).map(r => r.animalId));
        const c = uAnims.size;
        const pct = totalAnims > 0 ? Math.round((c / totalAnims) * 100) : 0;
        vStats.push({ name: vName, count: c, total: totalAnims, pct });
      });
      vStats.sort((a,b) => b.pct - a.pct);
      setVaccineStats(vStats);

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

  const getSummaryText = (data) => {
    const over = data.find(d => d.name === 'Overdue')?.value || 0;
    const due = data.find(d => d.name === 'Due Soon')?.value || 0;
    const up = data.find(d => d.name === 'Up to Date')?.value || 0;
    
    if (over > 0) return `${over} animal${over > 1 ? 's' : ''} ${over > 1 ? 'are' : 'is'} overdue for vaccination.`;
    if (due > 0) return `${due} animal${due > 1 ? 's' : ''} need${due > 1 ? '' : 's'} vaccination attention soon.`;
    if (up > 0) return "Most of your animals are up to date.";
    return "No animals to track.";
  };

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

      {/* NEW GRAPHICS SECTION */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Donut Chart */}
        <Card className="p-5 flex flex-col min-h-[360px]">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">My Herd Vaccination Coverage</h3>
            <p className="text-xs text-slate-500 mt-1">Vaccination status across your livestock.</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[180px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={donutData}
                   innerRadius={65}
                   outerRadius={85}
                   paddingAngle={2}
                   dataKey="value"
                   stroke="none"
                   isAnimationActive={true}
                 >
                   {donutData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip 
                   formatter={(value, name) => [`${value} animals`, name]}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
               </PieChart>
             </ResponsiveContainer>
             
             {/* Center Text */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</span>
               <span className="text-3xl font-black text-slate-800 leading-none">{animalCount}</span>
             </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 space-y-2 px-2">
            {donutData.map(d => {
              // Ensure overdue stands out even in text
              const isOverdue = d.name === 'Overdue';
              return (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className={`font-semibold ${isOverdue ? 'text-red-700' : 'text-slate-700'}`}>{d.name}</span>
                  </div>
                  <div className={`font-medium ${isOverdue ? 'text-red-700' : 'text-slate-600'}`}>
                    {d.value} <span className={`text-xs ml-1 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>({animalCount > 0 ? Math.round((d.value/animalCount)*100) : 0}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary Text */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-600">{getSummaryText(donutData)}</p>
          </div>
        </Card>

        {/* Right: Coverage Bars */}
        <Card className="p-5 flex flex-col min-h-[360px]">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Vaccination Coverage by Vaccine</h3>
            <p className="text-xs text-slate-500 mt-1">Specific vaccine administration across herd.</p>
          </div>
          
          <div className="space-y-6 flex-1">
            {vaccineStats.length === 0 && <div className="h-full flex items-center justify-center"><p className="text-slate-400 text-sm">No vaccination data available.</p></div>}
            {vaccineStats.map(v => (
              <div key={v.name} className="animate-in fade-in duration-500">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="font-bold text-slate-800 text-[13px]">{v.name}</div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{v.count} / {v.total}</div>
                  </div>
                  <div className="font-black text-teal-800 text-lg">{v.pct}%</div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full bg-teal-600 transition-all duration-1000 ease-out"
                    style={{ width: `${v.pct}%` }} 
                  />
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
