import React, { useState, useEffect } from 'react';
import { PawPrint, CheckCircle2, Eye, AlertTriangle, ShieldAlert, Syringe, Bell, ChevronRight, Activity } from 'lucide-react';
import { SectionTitle, StatCard, Card, RiskBadge } from '../common/UIComponents';
import { api } from '../../services/api/api';

export default function FarmerDashboard({ liveData, fieldMode, setPage, role, actions }) {
  const [animals, setAnimals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [animRes, alertRes, vaxRes] = await Promise.all([
          api.animals.getAll(),
          api.alerts.getAll(),
          api.vaccination.getRecords()
        ]);
        if (animRes.success) {
          setAnimals(animRes.data);
        } else {
          setError(animRes.error || 'Failed to load animals from backend');
        }
        
        if (alertRes && Array.isArray(alertRes)) {
          setAlerts(alertRes);
        } else {
          setAlerts([]);
        }

        if (vaxRes.success) {
          setVaccinations(vaxRes.data);
        } else {
          setVaccinations([]);
        }
      } catch (err) {
        setError('Failed to connect to authoritative backend');
      }
      setLoading(false);
    }
    loadData();
  }, []);

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
      </div>
    );
  }

  const total   = animals.length;
  const healthy = animals.filter(a => a.riskLevel === 'GREEN').length;
  const monitor = animals.filter(a => a.riskLevel === 'YELLOW').length;
  const highRisk= animals.filter(a => a.riskLevel === 'ORANGE' || a.riskLevel === 'RED').length;
  const critical= animals.filter(a => a.riskLevel === 'CRITICAL').length;

  // The backend already scopes animals to the user's farm
  const myAnimals = animals;

  const alertAnimals = animals
    .filter(a => a.riskLevel !== 'GREEN')
    // We do not have riskEval score directly, so we just slice
    .slice(0, 4);

  // Backend provides real alerts
  const openAlerts = alerts.filter(a => a.status === 'OPEN').length;

  const today = new Date().toISOString().split('T')[0];
  const overdueVacs = vaccinations
    .filter(v => v.nextDueDate && v.nextDueDate < today && myAnimals.some(a => a.id === v.animalId));

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
              const farmName = a.farm?.name || '';
              return (
                <button key={a.id} onClick={() => setPage?.('animal-profile', a.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 bg-white hover:bg-teal-50 transition-colors text-left">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{a.tagId || a.id}
                      <span className="ml-2 text-xs font-normal text-slate-400">· {farmName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Health anomaly detected by backend</div>
                  </div>
                  <div className="ml-2 shrink-0">
                    <RiskBadge level={a.riskLevel || 'GREEN'} />
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
              const diseaseName = v.vaccine?.name || v.vaccineName || v.diseaseId;
              return (
                <div key={v.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 border border-amber-100">
                  <span className="text-amber-900 font-medium text-xs">{diseaseName} — {v.animalId}</span>
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
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${q.color}`}>
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
                <th className="px-4 py-3">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myAnimals.map(a => {
                const speciesName = a.species?.name || 'Unknown Species';
                const breedName = a.breed?.name || 'Unknown Breed';
                return (
                  <tr key={a.id} onClick={() => setPage?.('animal-profile', a.id)} className="hover:bg-teal-50 cursor-pointer">
                    <td className="px-4 py-3"><div className="font-bold text-teal-800 text-xs">{a.tagId || a.id}</div></td>
                    <td className="px-4 py-3 text-slate-600">{speciesName} · <span className="text-slate-400">{breedName}</span></td>
                    <td className="px-4 py-3"><RiskBadge level={a.riskLevel || 'GREEN'} /></td>
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