import React from 'react';
import { ShieldAlert, AlertTriangle, Eye, FlaskConical, Network, ClipboardList, ChevronRight, Activity, Bell } from 'lucide-react';
import { SectionTitle, StatCard, Card, RiskBadge } from '../common/UIComponents';

export default function VetDashboard({ liveData, setPage, role, actions }) {
  const critical   = liveData.animals.filter(a => a.riskEval?.healthRiskLevel === 'CRITICAL').length;
  const red        = liveData.animals.filter(a => a.riskEval?.healthRiskLevel === 'RED').length;
  const orange     = liveData.animals.filter(a => a.riskEval?.healthRiskLevel === 'ORANGE').length;
  const labPending = (liveData.labSamples || []).filter(s => s.result === 'Pending').length;
  const openCases  = (liveData.cases || []).filter(c => c.stage !== 'Closed').length;
  const openAlerts = (liveData.alerts || []).filter(a => a.status === 'OPEN').length;

  const priorityAlerts = liveData.animals
    .filter(a => a.riskEval?.healthRiskLevel === 'CRITICAL' || a.riskEval?.healthRiskLevel === 'RED' || a.riskEval?.healthRiskLevel === 'ORANGE')
    .sort((a,b) => (b.riskEval?.score||0) - (a.riskEval?.score||0))
    .slice(0, 6);

  const recentCases = (liveData.cases || [])
    .filter(c => c.stage !== 'Closed')
    .sort((a,b) => new Date(b.openedAt) - new Date(a.openedAt))
    .slice(0, 4)
    .map(c => {
      const animal  = (liveData.animals||[]).find(a => a.id === c.animalId) || {};
      const disease = (liveData.diseases||[]).find(d => d.id === c.suspectedDiseaseId) || {};
      return { ...c, animal, disease };
    });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <SectionTitle eyebrow="Veterinarian" title="Case Triage Overview" />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="Critical"      value={critical}   icon={ShieldAlert}   tone="darkred" />
        <StatCard label="RED Alerts"    value={red}        icon={AlertTriangle}  tone="red" />
        <StatCard label="Field Check"   value={orange}     icon={Eye}            tone="orange" />
        <StatCard label="Lab Pending"   value={labPending} icon={FlaskConical}   tone="amber" />
        <StatCard label="Open Cases"    value={openCases}  icon={ClipboardList}  tone="teal" />
        <StatCard label="Open Alerts"   value={openAlerts} icon={Bell}           tone="slate" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Priority alert queue */}
        <Card className="overflow-x-auto p-0 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white">
            <h3 className="text-sm font-bold text-slate-900">Priority Alert Queue</h3>
            <button onClick={() => setPage('alerts')} className="text-xs text-teal-700 font-semibold hover:underline">All Alerts ({openAlerts}) →</button>
          </div>
          <table className="w-full text-left text-sm bg-white min-w-[500px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Animal</th><th className="px-4 py-3">Farm · District</th>
                <th className="px-4 py-3">Species</th><th className="px-4 py-3">Top Signal</th><th className="px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {priorityAlerts.length > 0 ? priorityAlerts.map(a => {
                const farm    = (liveData.farms||[]).find(f => f.id === a.farmId);
                const species = (liveData.species||[]).find(s => s.id === a.speciesId);
                return (
                  <tr key={a.id} onClick={() => setPage('animal-profile', a.id)}
                    className="border-b border-slate-50 hover:bg-teal-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-bold text-teal-800">{a.name || a.id}</td>
                    <td className="px-4 py-3 text-slate-600">{farm?.name} · <span className="text-slate-400">{farm?.district}</span></td>
                    <td className="px-4 py-3 text-slate-500">{species?.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                      {a.riskEval?.reasons?.[0]?.text || 'Baseline deviation'}
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={a.riskEval?.healthRiskLevel || 'GREEN'} /></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No active priority alerts.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick nav */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Quick Access</h3>
            <div className="space-y-1.5">
              {[
                { label:'Risk Monitor',         page:'risk',     icon:ShieldAlert },
                { label:'Exposure Intelligence', page:'exposure', icon:Network },
                { label:'Case Workflow',         page:'cases',    icon:ClipboardList },
                { label:'Laboratory',            page:'lab',      icon:FlaskConical },
                { label:'Disease Knowledge',     page:'diseases', icon:Activity },
              ].map(q => (
                <button key={q.page} onClick={() => setPage(q.page)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                  <span className="flex items-center gap-2.5"><q.icon size={15} className="text-teal-600" />{q.label}</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              ))}
            </div>
          </Card>

          {/* Open cases */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Active Cases</h3>
              <button onClick={() => setPage('cases')} className="text-xs text-teal-700 font-semibold hover:underline">All →</button>
            </div>
            <div className="space-y-1.5">
              {recentCases.length ? recentCases.map(c => (
                <button key={c.id} onClick={() => setPage('cases')} className="w-full text-left rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 text-xs">
                  <div className="font-bold text-slate-800">{c.animalId}</div>
                  <div className="text-slate-500">{c.disease?.shortName || '—'}</div>
                  <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 mt-0.5">{c.stage}</span>
                </button>
              )) : <p className="text-slate-400 text-xs text-center py-3">No open cases.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}