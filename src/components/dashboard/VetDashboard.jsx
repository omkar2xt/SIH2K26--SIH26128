import React from 'react';
import { ShieldAlert, AlertTriangle, Eye, FlaskConical, Network, ClipboardList, ChevronRight } from 'lucide-react';
import { SectionTitle, StatCard, Card, RiskBadge } from '../common/UIComponents';

export default function VetDashboard({ liveData, setPage }) {
  const critical = liveData.animals.filter(a => a.riskEval?.riskLevel === "CRITICAL").length;
  const high = liveData.animals.filter(a => a.riskEval?.riskLevel === "RED").length;
  const medium = liveData.animals.filter(a => a.riskEval?.riskLevel === "ORANGE").length;

  const alerts = liveData.animals
    .filter(a => a.riskEval?.riskLevel !== "GREEN" && a.riskEval?.riskLevel !== "YELLOW")
    .sort((a, b) => b.riskEval.score - a.riskEval.score);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle eyebrow="Veterinarian" title="Case triage overview" />
      
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        <StatCard label="Critical" value={critical} icon={ShieldAlert} tone="darkred" />
        <StatCard label="High Risk" value={high} icon={AlertTriangle} tone="red" />
        <StatCard label="Medium Risk" value={medium} icon={Eye} tone="orange" />
        <StatCard label="Lab Pending" value={3} icon={FlaskConical} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3 mb-6">
        <Card className="overflow-x-auto p-0 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white">
            <h3 className="text-sm font-bold text-slate-900">Priority alert queue (Live)</h3>
          </div>
          <table className="w-full text-left text-sm bg-white">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Animal</th>
                <th className="px-4 py-3">Farm</th>
                <th className="px-4 py-3">Species</th>
                <th className="px-4 py-3">Abnormality</th>
                <th className="px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length > 0 ? alerts.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-teal-800">{a.id}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{a.farmName}</td>
                  <td className="px-4 py-3 text-slate-500">{a.species}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                    {a.riskEval.reasons[0]?.text || "Baseline deviation"}
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={a.riskEval.riskLevel} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                    No active priority alerts. The simulation will generate alerts over time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 bg-white">
          <h3 className="mb-4 text-sm font-bold text-slate-900">Shortcuts</h3>
          <div className="space-y-2">
            <button onClick={() => setPage("risk")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <span className="flex items-center gap-3"><ShieldAlert size={16} className="text-teal-600" />Risk Monitor</span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            <button onClick={() => setPage("exposure")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <span className="flex items-center gap-3"><Network size={16} className="text-teal-600" />Exposure Intelligence</span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            <button onClick={() => setPage("cases")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <span className="flex items-center gap-3"><ClipboardList size={16} className="text-teal-600" />Case Workflow</span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            <button onClick={() => setPage("lab")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
              <span className="flex items-center gap-3"><FlaskConical size={16} className="text-teal-600" />Laboratory</span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}