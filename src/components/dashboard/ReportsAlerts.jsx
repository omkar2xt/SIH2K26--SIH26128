import React, { useState, useMemo } from 'react';
import { Bell, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Search, Filter, Download } from 'lucide-react';
import { Card, SectionTitle, RiskBadge } from '../common/UIComponents';
import { reportService } from '../../services/reportService';

const SEV_ORDER = { CRITICAL:4, RED:3, ORANGE:2, YELLOW:1, GREEN:0 };
const SEV_STYLE = {
  CRITICAL: 'bg-red-900 text-white border-red-900',
  RED:      'bg-red-100 text-red-900 border-red-300',
  ORANGE:   'bg-orange-100 text-orange-800 border-orange-300',
  YELLOW:   'bg-amber-100 text-amber-800 border-amber-300',
  GREEN:    'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function ReportsAlerts({ liveData, actions, setPage }) {
  const [filterStatus,   setFilterStatus]   = useState('OPEN');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [search,         setSearch]         = useState('');
  const [expanded,       setExpanded]       = useState(null);
  const [note,           setNote]           = useState({});
  const [saved,          setSaved]          = useState('');

  const alerts = useMemo(() => {
    const db = liveData;
    return (db.alerts || []).map(al => {
      const animal = db.animals?.find(a => a.id === al.animalId) || {};
      const farm   = db.farms?.find(f => f.id === animal.farmId) || {};
      return { ...al, animal, farm };
    }).sort((a,b) => (SEV_ORDER[b.severity]||0) - (SEV_ORDER[a.severity]||0) || new Date(b.createdAt) - new Date(a.createdAt));
  }, [liveData]);

  const filtered = alerts.filter(al => {
    if (filterStatus && al.status !== filterStatus) return false;
    if (filterSeverity && al.severity !== filterSeverity) return false;
    if (search) {
      const q = search.toLowerCase();
      return al.animalId?.toLowerCase().includes(q) || al.farm?.name?.toLowerCase().includes(q) || al.farm?.district?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = useMemo(() => {
    const c = { OPEN:0, ACKNOWLEDGED:0, RESOLVED:0, bySev:{} };
    alerts.forEach(al => { c[al.status]=(c[al.status]||0)+1; c.bySev[al.severity]=(c.bySev[al.severity]||0)+1; });
    return c;
  }, [alerts]);

  function flash(m) { setSaved(m); setTimeout(()=>setSaved(''), 2500); }
  function ack(id)  { actions.updateAlertStatus(id,'ACKNOWLEDGED'); flash('Alert acknowledged.'); }
  function resolve(id) { actions.updateAlertStatus(id,'RESOLVED', note[id]||''); flash('Alert resolved.'); }

  function exportReport() {
    const stats = reportService.getStateSummary();
    const distStats = reportService.getDistrictStats();
    reportService.exportCSV([stats], 'pashu_raksha_summary.csv');
  }

  const districtStats = useMemo(() => reportService.getDistrictStats(), [liveData]);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Surveillance & Notifications" title="Reports & Alerts">
        <div className="flex gap-2">
          {saved && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">{saved}</span>}
          <button onClick={exportReport} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download size={14} /> Export
          </button>
        </div>
      </SectionTitle>

      {/* Summary stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Open', value: counts.OPEN,         bg: 'bg-red-50 border-red-200', text: 'text-red-800' },
          { label: 'Acknowledged', value: counts.ACKNOWLEDGED||0, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
          { label: 'Resolved', value: counts.RESOLVED||0,    bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
          { label: 'Critical', value: counts.bySev?.CRITICAL||0, bg: 'bg-red-900 border-red-900', text: 'text-white' },
          { label: 'RED',      value: counts.bySev?.RED||0,      bg: 'bg-red-100 border-red-200',  text: 'text-red-900' },
          { label: 'Orange',   value: counts.bySev?.ORANGE||0,   bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <div className={`text-xl font-black ${s.text}`}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* District risk table */}
      <Card className="p-0 overflow-x-auto">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">District Risk Overview</h3>
          <button onClick={() => setPage('gis')} className="text-xs text-teal-700 font-semibold hover:underline">View Map →</button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2">District</th><th className="px-4 py-2 text-right">Animals</th>
              <th className="px-4 py-2 text-right">Farms</th><th className="px-4 py-2 text-right">Open Alerts</th>
              <th className="px-4 py-2 text-right">High-Risk</th><th className="px-4 py-2 text-right">Active Cases</th>
              <th className="px-4 py-2">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {districtStats.map(d => (
              <tr key={d.district} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-800">{d.district}</td>
                <td className="px-4 py-3 text-right text-slate-600">{d.animals}</td>
                <td className="px-4 py-3 text-right text-slate-600">{d.farms}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-700">{d.openAlerts}</td>
                <td className="px-4 py-3 text-right font-bold text-red-700">{d.highRisk}</td>
                <td className="px-4 py-3 text-right text-slate-600">{d.activeCases}</td>
                <td className="px-4 py-3"><RiskBadge level={d.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Alert filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="pl-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none" placeholder="Search by animal ID, farm, district…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option><option>OPEN</option><option>ACKNOWLEDGED</option><option>RESOLVED</option>
        </select>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
          <option value="">All Severities</option><option>CRITICAL</option><option>RED</option><option>ORANGE</option><option>YELLOW</option>
        </select>
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-10 text-center text-slate-400"><Bell size={32} className="mx-auto mb-2" /><p>No alerts match your filters.</p></div>
        )}
        {filtered.map(al => (
          <Card key={al.id} className={`border-l-4 ${al.severity === 'CRITICAL' ? 'border-red-900' : al.severity === 'RED' ? 'border-red-600' : al.severity === 'ORANGE' ? 'border-orange-500' : 'border-amber-400'}`}>
            <div className="p-4">
              <div className="flex flex-wrap justify-between gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${SEV_STYLE[al.severity]}`}>{al.severity}</span>
                    <span className="font-bold text-slate-900">{al.animalId}</span>
                    <span className="text-sm text-slate-500">{al.farm?.name} · {al.farm?.district}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${al.status === 'OPEN' ? 'bg-red-100 text-red-800' : al.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{al.status}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">{al.message}</p>
                  <div className="text-xs text-slate-400 mt-1">{al.id} · {new Date(al.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {al.status === 'OPEN' && (
                    <button onClick={() => ack(al.id)} className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100">
                      <CheckCircle2 size={12} /> Acknowledge
                    </button>
                  )}
                  {al.status !== 'RESOLVED' && (
                    <button onClick={() => setExpanded(expanded === al.id ? null : al.id)} className="flex items-center gap-1 text-xs font-semibold text-slate-600 border border-slate-200 px-2 py-1 rounded hover:bg-slate-50">
                      Resolve {expanded === al.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                  <button onClick={() => { setPage('animal-profile', al.animalId); }} className="text-xs font-semibold text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-50">View Animal</button>
                </div>
              </div>
              {expanded === al.id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Resolution note…" value={note[al.id]||''} onChange={e => setNote(n => ({ ...n, [al.id]: e.target.value }))} />
                  <button onClick={() => { resolve(al.id); setExpanded(null); }} className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                    <XCircle size={14} className="inline mr-1.5" />Mark Resolved
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
