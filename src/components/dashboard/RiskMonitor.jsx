import React, { useState } from 'react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import { ShieldAlert, Info } from 'lucide-react';

export default function RiskMonitor({ liveData, setPage }) {
  const atRisk = liveData.animals.filter(a => a.riskEval && a.riskEval.healthRiskLevel !== "GREEN")
                                 .sort((a, b) => b.riskEval.score - a.riskEval.score);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle title="Risk Monitor" />

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Animal</th>
              <th className="px-4 py-3">Risk Level</th>
              <th className="px-4 py-3">Primary Factors</th>
              <th className="px-4 py-3">Top Disease Risks</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {atRisk.length > 0 ? atRisk.map(a => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-teal-800">{a.id}</td>
                <td className="px-4 py-3"><RiskBadge level={a.riskEval.healthRiskLevel} /></td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">
                  {a.riskEval.reasons.map(r => r.text).join('; ')}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                  {a.riskEval.diseaseRisks.map(dr => dr.disease.name).join(', ') || "N/A"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-teal-700 font-bold hover:underline">Review</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">All animals are currently within baseline parameters.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
