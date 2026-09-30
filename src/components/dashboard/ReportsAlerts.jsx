import React, { useState, useMemo } from 'react';
import { Bell, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Search, Filter, Download, Camera } from 'lucide-react';
import { Card, SectionTitle, RiskBadge } from '../common/UIComponents';
import { reportService } from '../../services/reportService';
import { api } from '../../services/api/api';
import { useEffect } from 'react';

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
  const [snapshotOpen,   setSnapshotOpen]   = useState({});
  const [note,           setNote]           = useState({});
  const [saved,          setSaved]          = useState('');

  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await api.alerts.getAll();
        if (response && response.success) {
          setAlerts(response.data || []);
        } else {
          throw new Error(response?.error || 'Failed to fetch');
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setError('Failed to connect to backend for authoritative alerts.');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  const filtered = alerts.filter(al => {
    if (filterStatus && al.status !== filterStatus) return false;
    if (filterSeverity && al.severity !== filterSeverity) return false;
    if (search) {
      const q = search.toLowerCase();
      return al.animalTag?.toLowerCase().includes(q) || al.farmName?.toLowerCase().includes(q) || al.district?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = useMemo(() => {
    const c = { OPEN:0, ACKNOWLEDGED:0, RESOLVED:0, bySev:{} };
    alerts.forEach(al => { c[al.status]=(c[al.status]||0)+1; c.bySev[al.severity]=(c.bySev[al.severity]||0)+1; });
    return c;
  }, [alerts]);

  const [resolvingId, setResolvingId] = useState(null);

  function flash(m) { setSaved(m); setTimeout(()=>setSaved(''), 3000); }
  async function ack(id) { 
    try {
      const res = await api.alerts.acknowledge(id);
      if (res && res.success === false) {
        throw new Error(res.error || 'Failed to acknowledge alert');
      }
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
      flash('Alert acknowledged.'); 
    } catch (err) {
      flash('Error: ' + (err.message || 'Failed to acknowledge alert'));
    }
  }

  async function handleResolve(id) {
    try {
      setResolvingId(id);
      const resolutionNote = (note[id] || '').trim();
      const payload = resolutionNote ? { resolutionNote } : {};
      const res = await api.alerts.resolve(id, payload);
      if (res && res.success === false) {
        throw new Error(res.error || 'Failed to resolve alert');
      }
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
      setExpanded(null);
      flash('Alert resolved successfully.');
      // Refresh backend authoritative alerts
      const refreshed = await api.alerts.getAll();
      if (refreshed && (refreshed.success || Array.isArray(refreshed.data))) {
        setAlerts(refreshed.data || []);
      }
    } catch (err) {
      flash('Error: ' + (err.message || 'Failed to resolve alert'));
    } finally {
      setResolvingId(null);
    }
  }

  function exportReport() {
    const stats = reportService.getStateSummary();
    const distStats = reportService.getDistrictStats();
    reportService.exportCSV([stats], 'pashu_raksha_summary.csv');
  }

  const [districtStats, setDistrictStats] = useState([]);

  useEffect(() => {
    reportService.getDistrictStats().then(stats => setDistrictStats(stats));
  }, []);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Surveillance & Notifications" title="Reports & Alerts">
        <div className="flex gap-2">
          {saved && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              saved.startsWith('Error') 
                ? 'text-rose-700 bg-rose-50 border-rose-200' 
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
            }`}>
              {saved}
            </span>
          )}
          <button onClick={exportReport} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download size={14} /> Export
          </button>
        </div>
      </SectionTitle>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg font-bold">
          {error}
        </div>
      )}

      {loading && <div className="text-center py-4">Loading authoritative alerts...</div>}

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
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">District Risk Overview</h3>
          <button onClick={() => setPage('gis')} className="text-xs text-teal-700 font-semibold hover:underline">View Map →</button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm text-left min-w-[560px]">
            <thead className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-400 bg-slate-50">
              <tr>
                <th className="px-4 py-2.5">District</th>
                <th className="px-4 py-2.5 text-right">Animals</th>
                <th className="px-4 py-2.5 text-right">Farms</th>
                <th className="px-4 py-2.5 text-right">Open Alerts</th>
                <th className="px-4 py-2.5 text-right">High-Risk</th>
                <th className="px-4 py-2.5 text-right">Active Cases</th>
                <th className="px-4 py-2.5">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(districtStats || []).map(d => (
                <tr key={d.district} className="hover:bg-slate-50 transition-colors">
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
        </div>
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
            <div className="p-3.5 sm:p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${SEV_STYLE[al.severity]}`}>{al.severity}</span>
                    <span className="font-bold text-slate-900 text-sm sm:text-base">{al.animalTag}</span>
                    <span className="text-xs sm:text-sm text-slate-500 truncate">{al.farmName} · {al.district}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${al.status === 'OPEN' ? 'bg-red-100 text-red-800' : al.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{al.status}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed break-words">{al.message}</p>
                  <div className="text-[11px] text-slate-400 mt-1">{al.id} · {new Date(al.createdAt).toLocaleString('en-IN')}</div>
                </div>
                
                {/* Vertical on small screens, wrap naturally & comfortable touch targets */}
                <div className="flex flex-wrap items-center gap-2 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                  {al.status === 'OPEN' && (
                    <button 
                      type="button"
                      onClick={() => ack(al.id)} 
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors min-h-[38px]"
                    >
                      <CheckCircle2 size={14} /> <span>Acknowledge</span>
                    </button>
                  )}
                  {al.status !== 'RESOLVED' && (
                    <button 
                      type="button"
                      onClick={() => setExpanded(expanded === al.id ? null : al.id)} 
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors min-h-[38px]"
                    >
                      <span>Resolve</span> {expanded === al.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  {al.healthEvent?.snapshots?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSnapshotOpen(s => ({ ...s, [al.id]: !s[al.id] }))}
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors min-h-[38px] ${
                        snapshotOpen[al.id]
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'text-teal-700 border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      <Camera size={14} />
                      <span>Snapshot</span>
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => { setPage('animal-profile', al.animalTag); }} 
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center text-xs font-semibold text-teal-700 border border-teal-200 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors min-h-[38px]"
                  >
                    View Animal
                  </button>
                </div>
              </div>
              {expanded === al.id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    rows={2}
                    placeholder="Resolution note…"
                    value={note[al.id]||''}
                    onChange={e => setNote(n => ({ ...n, [al.id]: e.target.value }))}
                  />
                  <button
                    disabled={resolvingId === al.id}
                    onClick={() => handleResolve(al.id)}
                    className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    <XCircle size={14} className="inline mr-1.5" />
                    {resolvingId === al.id ? 'Resolving…' : 'Mark Resolved'}
                  </button>
                </div>
              )}
              {snapshotOpen[al.id] && al.healthEvent?.snapshots?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 bg-teal-50/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <Camera size={14} className="text-teal-700" />
                      Point-in-Time Event Snapshot
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {al.healthEvent.snapshots[0].id}
                    </span>
                  </div>
                  {(() => {
                    const snap = al.healthEvent.snapshots[0];
                    let snapData = {};
                    try {
                      snapData = typeof snap.snapshotJson === 'string' ? JSON.parse(snap.snapshotJson) : (snap.snapshotJson || {});
                    } catch (e) {
                      snapData = {};
                    }
                    const evalData = snapData.evaluation || snapData;
                    const reasons = evalData.reasons || [];
                    const summary = snapData.summary || evalData.explanation?.whyItMatters || evalData.explanation?.whatChanged || 'Observation & risk evaluation context captured';
                    const drops = evalData.telemetryDrops || {
                      ...(evalData.actDrop ? { activityDrop: evalData.actDrop } : {}),
                      ...(evalData.feedDrop ? { feedingDrop: evalData.feedDrop } : {}),
                      ...(evalData.rumDrop ? { ruminationDrop: evalData.rumDrop } : {}),
                      ...(evalData.moveDrop ? { movementDrop: evalData.moveDrop } : {}),
                    };

                    return (
                      <div className="space-y-2 text-xs">
                        <div className="text-slate-700 font-semibold">{summary}</div>
                        {drops && Object.keys(drops).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(drops).map(([k, v]) => (
                              <div key={k} className="px-2 py-0.5 bg-red-100/70 border border-red-200 rounded text-red-800 text-[11px] font-medium">
                                {k.replace(/([A-Z])/g, ' $1').toLowerCase()}: <strong>-{v}%</strong>
                              </div>
                            ))}
                          </div>
                        )}
                        {reasons.length > 0 && (
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {reasons.map((r, ri) => (
                              <li key={ri}>{typeof r === 'string' ? r : r.text}</li>
                            ))}
                          </ul>
                        )}
                        {(evalData.recommendedAction || snapData.recommendedAction) && (
                          <div className="bg-white border border-teal-200 text-teal-800 p-2 rounded">
                            <strong>Recommended Action:</strong> {evalData.recommendedAction || snapData.recommendedAction}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          Captured at: {new Date(snap.createdAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
