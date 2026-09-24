import React, { useState, useEffect } from 'react';
import { MapPin, Shield, Plus, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { Card, SectionTitle } from '../common/UIComponents';
import { reportService } from '../../services/reportService';

const DIST_RISK_COLOR = { RED:'bg-red-100 text-red-800 border-red-200', ORANGE:'bg-orange-100 text-orange-800 border-orange-200', YELLOW:'bg-amber-100 text-amber-800 border-amber-200', GREEN:'bg-emerald-100 text-emerald-800 border-emerald-200' };

export default function OfficialDashboard({ liveData, actions }) {
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ district:'Nashik', description:'', diseaseId:'', reason:'', restrictedMovement: true });
  const [saved, setSaved] = useState('');

  const [summary, setSummary] = useState({ totalAnimals: 0, totalFarms: 0, openAlerts: 0, criticalAlerts: 0, activeCases: 0, pendingLabs: 0, highRiskAnimals: 0, activeExposures: 0, containmentZones: 0, overdueVaccinations: 0 });
  const [districtStats, setDistrictStats] = useState([]);
  const [diseaseDistribution, setDiseaseDistribution] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, d, dd] = await Promise.all([
          reportService.getStateSummary(),
          reportService.getDistrictStats(),
          reportService.getDiseaseDistribution()
        ]);
        setSummary(s);
        setDistrictStats(d);
        setDiseaseDistribution(dd);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);
  const zones = liveData.containmentZones || [];

  function createZone() {
    actions.addContainmentZone({ ...zoneForm, status: 'ACTIVE' });
    setShowZoneForm(false);
    setZoneForm({ district:'Nashik', description:'', diseaseId:'', reason:'', restrictedMovement: true });
    setSaved('Containment zone activated!'); setTimeout(()=>setSaved(''), 2500);
  }

  function toggleZone(id, status) {
    actions.updateContainmentStatus(id, status === 'ACTIVE' ? 'LIFTED' : 'ACTIVE');
  }

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Government Control Room" title="State Animal Health Dashboard">
        {saved && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">{saved}</span>}
      </SectionTitle>

      {/* State summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Animals',     value: summary.totalAnimals,    bg: 'bg-white' },
          { label: 'Open Alerts',       value: summary.openAlerts,      bg: 'bg-red-50 border-red-200', textColor:'text-red-900' },
          { label: 'Active Cases',      value: summary.activeCases,     bg: 'bg-amber-50 border-amber-200', textColor:'text-amber-900' },
          { label: 'High-Risk Animals', value: summary.highRiskAnimals, bg: 'bg-orange-50 border-orange-200', textColor:'text-orange-900' },
          { label: 'Pending Lab Tests', value: summary.pendingLabs,     bg: 'bg-purple-50 border-purple-200', textColor:'text-purple-900' },
          { label: 'Active Exposures',  value: summary.activeExposures, bg: 'bg-blue-50 border-blue-200', textColor:'text-blue-900' },
          { label: 'Containment Zones', value: summary.containmentZones,bg: 'bg-rose-50 border-rose-200', textColor:'text-rose-900' },
          { label: 'Overdue Vax',       value: summary.overdueVaccinations, bg: 'bg-slate-50' },
        ].map(s => (
          <Card key={s.label} className={`p-4 text-center ${s.bg}`}>
            <div className={`text-2xl font-black ${s.textColor || 'text-slate-900'}`}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Containment zones */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5"><Shield size={15} />Containment Zones</h3>
          <button onClick={() => setShowZoneForm(s => !s)} className="flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600">
            <Plus size={12} /> Create Zone
          </button>
        </div>

        {showZoneForm && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <h4 className="font-bold text-rose-900 text-sm mb-3">New Containment Zone</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">District</span>
                <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={zoneForm.district} onChange={e => setZoneForm(f => ({ ...f, district: e.target.value }))}>
                  {(liveData.districts || []).map(d => <option key={d.id}>{d.id}</option>)}
                </select>
              </label>
              <label className="block"><span className="text-xs font-semibold text-slate-600 block mb-1">Disease</span>
                <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={zoneForm.diseaseId} onChange={e => setZoneForm(f => ({ ...f, diseaseId: e.target.value }))}>
                  <option value="">— Select Disease —</option>
                  {(liveData.diseases || []).map(d => <option key={d.id} value={d.id}>{d.shortName}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-600 block mb-1">Description</span>
                <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={zoneForm.description} onChange={e => setZoneForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. 5 km radius containment — FMD outbreak" />
              </label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-600 block mb-1">Reason / Authority</span>
                <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={zoneForm.reason} onChange={e => setZoneForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Lab-confirmed FMD — Section 12 Powers" />
              </label>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={createZone} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">Activate Zone</button>
              <button onClick={() => setShowZoneForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
            </div>
          </div>
        )}

        {zones.length === 0 && <p className="text-slate-400 text-sm py-4 text-center">No containment zones active.</p>}
        {zones.map(z => {
          const disease = (liveData.diseases || []).find(d => d.id === z.diseaseId);
          return (
            <div key={z.id} className={`rounded-lg border p-3 mb-2 ${z.status === 'ACTIVE' ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin size={14} className={z.status === 'ACTIVE' ? 'text-rose-600' : 'text-slate-400'} />
                    {z.district} — {disease?.shortName || '—'}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${z.status === 'ACTIVE' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{z.status}</span>
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">{z.description}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{z.reason}</div>
                  <div className="text-xs text-slate-400">Started: {new Date(z.startTime).toLocaleString('en-IN')}</div>
                </div>
                <button onClick={() => toggleZone(z.id, z.status)} className={`text-xs font-semibold px-2 py-1 rounded border ${z.status === 'ACTIVE' ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'}`}>
                  {z.status === 'ACTIVE' ? 'Lift Zone' : 'Reactivate'}
                </button>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Disease Distribution Chart */}
      <Card className="p-4">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5 mb-4">
          <Activity size={15} className="text-purple-600" /> Disease Distribution Overview
        </h3>
        {diseaseDistribution.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No active cases reported.</p>
        ) : (
          <div className="space-y-3">
            {diseaseDistribution.map((d, i) => {
              const maxCases = Math.max(...diseaseDistribution.map(x => x.cases));
              const width = Math.max(5, (d.cases / maxCases) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-32 text-xs font-semibold text-slate-700 truncate">{d.disease}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${width}%` }}></div>
                  </div>
                  <div className="w-8 text-xs font-bold text-slate-600 text-right">{d.cases}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* District risk table */}
      <Card className="overflow-x-auto p-0">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">District Risk Overview</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">District</th><th className="px-4 py-3 text-right">Animals</th>
              <th className="px-4 py-3 text-right">Farms</th><th className="px-4 py-3 text-right">Open Alerts</th>
              <th className="px-4 py-3 text-right">High-Risk</th><th className="px-4 py-3 text-right">Exposures</th>
              <th className="px-4 py-3 text-right">Active Cases</th><th className="px-4 py-3">Risk Level</th>
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
                <td className="px-4 py-3 text-right text-slate-600">{d.exposures}</td>
                <td className="px-4 py-3 text-right text-slate-600">{d.activeCases}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIST_RISK_COLOR[d.riskLevel]}`}>{d.riskLevel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}