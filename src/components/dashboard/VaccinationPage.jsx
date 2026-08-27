import React from 'react';
import { SectionTitle, Card } from '../common/UIComponents';
import { Syringe, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function VaccinationPage({ liveData, role }) {
  // If role is farmer, just show a simple view (already handled in App routing technically, but let's be safe)
  if (role === "farmer" || role === "field") {
    return (
      <div className="animate-in fade-in duration-300">
        <SectionTitle title="Herd Vaccination Status" />
        <Card className="p-8 text-center text-slate-500">
          No vaccination campaigns currently active for your registered farms.
        </Card>
      </div>
    );
  }

  // Official / Vet Role - District level surveillance
  // Mock data for the Government Dashboard
  const coverageData = [
    { district: "Nashik", species: "Cattle", eligible: 412, vaccinated: 318, coverage: 77.2, pending: 94, lastCampaign: "2026-06-15" },
    { district: "Nashik", species: "Buffalo", eligible: 156, vaccinated: 140, coverage: 89.7, pending: 16, lastCampaign: "2026-06-15" },
    { district: "Pune", species: "Cattle", eligible: 840, vaccinated: 512, coverage: 61.0, pending: 328, lastCampaign: "2025-11-10" },
    { district: "Pune", species: "Sheep", eligible: 1200, vaccinated: 450, coverage: 37.5, pending: 750, lastCampaign: "2025-08-01" },
  ];

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <SectionTitle eyebrow="District & State Surveillance" title="Vaccination Coverage">
        <div className="flex gap-2">
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>FMD (Foot and Mouth)</option><option>HS</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Districts</option></select>
          <button className="bg-teal-800 text-white px-3 py-1.5 rounded text-sm font-bold">Export Report</button>
        </div>
      </SectionTitle>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-teal-50 border-teal-100 flex items-center gap-4">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-full"><Syringe size={24} /></div>
          <div>
            <div className="text-xs font-bold text-teal-800 uppercase">Statewide FMD Coverage</div>
            <div className="text-2xl font-bold text-teal-900">68.4%</div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-full"><AlertTriangle size={24} /></div>
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase">Low Coverage Areas</div>
            <div className="text-2xl font-bold text-amber-900">14 Blocks</div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-full"><ShieldCheck size={24} /></div>
          <div>
            <div className="text-xs font-bold text-blue-800 uppercase">Doses Administered (YTD)</div>
            <div className="text-2xl font-bold text-blue-900">1.2M</div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="p-0 lg:col-span-3 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Coverage by District <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2 normal-case">DEMO DATA</span></h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Species</th>
                <th className="px-4 py-3 text-right">Eligible Animals</th>
                <th className="px-4 py-3 text-right">Vaccinated</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Coverage</th>
                <th className="px-4 py-3">Last Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coverageData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{row.district}</td>
                  <td className="px-4 py-3 text-slate-600">{row.species}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.eligible}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.vaccinated}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.pending}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${row.coverage < 50 ? 'text-red-600' : row.coverage < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {row.coverage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{row.lastCampaign}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-4 lg:col-span-1">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              Vaccination Alerts
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="font-bold text-red-900">Pune: Sheep (37.5%)</div>
                <div className="text-xs text-red-700 mt-1">Critical low coverage. High vulnerability to upcoming seasonal risks.</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="font-bold text-amber-900">Pune: Cattle (61.0%)</div>
                <div className="text-xs text-amber-700 mt-1">Campaign overdue by 3 months. Plan immediate booster rollout.</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
