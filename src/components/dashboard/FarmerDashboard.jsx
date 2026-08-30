import React from 'react';
import { PawPrint, CheckCircle2, Eye, AlertTriangle, ShieldAlert, Syringe, Bell, ChevronRight } from 'lucide-react';
import { SectionTitle, StatCard, Card, RiskBadge } from '../common/UIComponents';

export default function FarmerDashboard({ liveData, fieldMode, setPage, role, actions }) {
  const total   = liveData.animals.length;
  const healthy = liveData.animals.filter(a => a.riskEval?.healthRiskLevel === 'GREEN').length;
  const monitor = liveData.animals.filter(a => a.riskEval?.healthRiskLevel === 'YELLOW').length;
  const highRisk= liveData.animals.filter(a => a.riskEval?.healthRiskLevel === 'ORANGE' || a.riskEval?.healthRiskLevel === 'RED').length;
  const critical= liveData.animals.filter(a => a.riskEval?.healthRiskLevel === 'CRITICAL').length;

  // My farm animals (first farm in list; in real system would use session farmId)
  const myFarm    = (liveData.farms || [])[0];
  const myAnimals = myFarm
    ? liveData.animals.filter(a => a.farmId === myFarm.id)
    : liveData.animals.slice(0, 6);

  const alertAnimals = liveData.animals
    .filter(a => a.riskEval?.healthRiskLevel !== 'GREEN')
    .sort((a,b) => (b.riskEval?.score||0) - (a.riskEval?.score||0))
    .slice(0, 4);

  const openAlerts = (liveData.alerts || []).filter(a => a.status === 'OPEN').length;

  // Overdue vaccinations for my farm
  const today = new Date().toISOString().split('T')[0];
  const overdueVacs = (liveData.vaccinations || [])
    .filter(v => v.nextDue && v.nextDue < today && myAnimals.some(a => a.id === v.animalId));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <SectionTitle eyebrow={fieldMode ? 'Field Worker' : 'Farmer Portal'} title={fieldMode ? 'Field Overview' : 'My Herd Overview'} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total Animals"  value={total}    icon={PawPrint}     tone="teal" />
        <StatCard label="Healthy"        value={healthy}  icon={CheckCircle2} tone="emerald" />
        <StatCard label="Monitor"        value={monitor}  icon={Eye}          tone="amber" />
        <StatCard label="High Risk"      value={highRisk} icon={AlertTriangle} tone="orange" />
        <StatCard label="Critical"       value={critical} icon={ShieldAlert}  tone="darkred" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active alerts */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Active Health Alerts</h3>
            <button onClick={() => setPage?.('alerts')} className="text-xs text-teal-700 font-semibold hover:underline">View all ({openAlerts}) →</button>
          </div>
          <div className="space-y-2">
            {alertAnimals.length > 0 ? alertAnimals.map(a => {
              const farm = (liveData.farms || []).find(f => f.id === a.farmId);
              const species = (liveData.species || []).find(s => s.id === a.speciesId);
              return (
                <button key={a.id} onClick={() => setPage?.('animal-profile', a.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 bg-white hover:bg-teal-50 transition-colors text-left">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{a.name || a.id}
                      <span className="ml-2 text-xs font-normal text-slate-400">· {farm?.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.riskEval?.reasons?.[0]?.text || 'Baseline deviation detected'}</div>
                  </div>
                  <div className="ml-2 shrink-0">
                    <RiskBadge level={a.riskEval?.healthRiskLevel || 'GREEN'} />
                  </div>
                </button>
              );
            }) : (
              <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500" />
                No active health alerts in your herd.
              </div>
            )}
          </div>
        </Card>

        {/* Vaccination reminders */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Vaccination Reminders</h3>
            <Syringe size={15} className="text-teal-600" />
          </div>
          <div className="space-y-2 text-sm">
            {overdueVacs.length === 0 ? (
              <div className="text-center py-3 text-emerald-700 text-xs font-semibold">✓ All vaccinations current</div>
            ) : overdueVacs.slice(0,4).map(v => {
              const disease = (liveData.diseases || []).find(d => d.id === v.diseaseId);
              return (
                <div key={v.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 border border-amber-100">
                  <span className="text-amber-900 font-medium text-xs">{disease?.shortName || v.diseaseId} — {v.animalId}</span>
                  <span className="text-[10px] font-bold text-red-700">Overdue</span>
                </div>
              );
            })}
            <button onClick={() => setPage?.('vaccination')} className="w-full mt-1 text-xs text-teal-700 font-semibold hover:underline text-center">Manage vaccinations →</button>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Report Health Issue', page: 'report', icon: Bell, color: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100' },
          { label: 'View My Animals',     page: 'animals', icon: PawPrint, color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100' },
          { label: 'Vaccination Records', page: 'vaccination', icon: Syringe, color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' },
          { label: 'My Alerts',           page: 'alerts', icon: Bell, color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' },
        ].map(q => (
          <button key={q.page} onClick={() => setPage?.(q.page)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-colors ${q.color}`}>
            <q.icon size={20} />
            {q.label}
          </button>
        ))}
      </div>

      {/* My animals */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">My Animals ({myAnimals.length})</h3>
          <button onClick={() => setPage?.('animals')} className="text-xs text-teal-700 font-semibold hover:underline">View all →</button>
        </div>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Animal</th><th className="px-4 py-3">Species · Breed</th>
                <th className="px-4 py-3">Activity</th><th className="px-4 py-3">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myAnimals.map(a => {
                const species = (liveData.species||[]).find(s => s.id === a.speciesId);
                const breed   = (liveData.breeds||[]).find(b => b.id === a.breedId);
                const actDrop = a.baseline?.activity > 0 ? Math.round(((a.baseline.activity - a.current.activity) / a.baseline.activity) * 100) : 0;
                return (
                  <tr key={a.id} onClick={() => setPage?.('animal-profile', a.id)} className="hover:bg-teal-50 cursor-pointer">
                    <td className="px-4 py-3"><div className="font-bold text-teal-800 text-xs">{a.id}</div><div>{a.name || '—'}</div></td>
                    <td className="px-4 py-3 text-slate-600">{species?.name} · <span className="text-slate-400">{breed?.name}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${actDrop >= 25 ? 'text-red-600' : actDrop >= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {a.current?.activity}% {actDrop > 0 && <span className="text-[10px]">▼{actDrop}%</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={a.riskEval?.healthRiskLevel || 'GREEN'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}