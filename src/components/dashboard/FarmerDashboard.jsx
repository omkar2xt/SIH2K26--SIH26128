import React from 'react';
import { PawPrint, CheckCircle2, Eye, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SectionTitle, StatCard, Card, RiskBadge, AnimalsTable } from '../common/UIComponents';

export default function FarmerDashboard({ liveData, fieldMode }) {
  const total = liveData.animals.length;
  // Calculate stats based on liveData
  const healthy = liveData.animals.filter(a => a.riskEval?.riskLevel === "GREEN").length;
  const observation = liveData.animals.filter(a => a.riskEval?.riskLevel === "YELLOW").length;
  const highRisk = liveData.animals.filter(a => a.riskEval?.riskLevel === "ORANGE" || a.riskEval?.riskLevel === "RED").length;
  const critical = liveData.animals.filter(a => a.riskEval?.riskLevel === "CRITICAL").length;

  const alerts = liveData.animals
    .filter(a => a.riskEval?.riskLevel !== "GREEN")
    .sort((a, b) => b.riskEval.score - a.riskEval.score)
    .slice(0, 3);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle 
        eyebrow={fieldMode ? "Field Worker" : "Farmer"} 
        title={fieldMode ? "Field overview" : "Herd overview"} 
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 mb-6">
        <StatCard label="Total Animals" value={total} icon={PawPrint} tone="teal" />
        <StatCard label="Healthy" value={healthy} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Observation" value={observation} icon={Eye} tone="amber" />
        <StatCard label="High Risk" value={highRisk} icon={AlertTriangle} tone="orange" />
        <StatCard label="Critical" value={critical} icon={ShieldAlert} tone="darkred" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Live Alerts (from simulation)</h3>
          </div>
          <div className="space-y-2">
            {alerts.length > 0 ? alerts.map((a) => (
              <div key={a.id} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 bg-white">
                <div>
                  <div className="text-sm font-bold text-slate-800">{a.id} <span className="font-medium text-slate-400">· {a.farmName}</span></div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.riskEval.reasons[0]?.text || "Baseline deviation"}</div>
                </div>
                <RiskBadge level={a.riskEval.riskLevel} />
              </div>
            )) : (
              <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">No active alerts detected in your herd.</div>
            )}
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Vaccination reminders</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 border border-amber-100">
              <span className="text-amber-800 font-medium">FMD booster — MH-CAT-014</span>
              <span className="text-xs font-bold text-amber-700">5 days</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
              <span className="text-slate-600 font-medium">PPR — MH-SHP-055</span>
              <span className="text-xs font-bold text-slate-500">18 days</span>
            </div>
          </div>
        </Card>
      </div>

      <SectionTitle title="My animals" />
      <AnimalsTable animals={liveData.animals.slice(0, 5)} />
    </div>
  );
}