import React from 'react';
import { Building2, MapPin, Users, Activity, Plus } from 'lucide-react';
import { SectionTitle, Card, StatCard, RiskBadge } from '../common/UIComponents';

export default function FarmsList({ liveData, setPage }) {
  const { farms, animals, alerts } = liveData;

  const totalFarms = farms.length;
  const activeFarms = farms.filter(f => f.status === 'Active').length || totalFarms;
  const highRiskFarms = farms.filter(f => {
    // Determine risk based on animals in the farm
    const farmAnimals = animals.filter(a => a.farmId === f.id);
    return farmAnimals.some(a => a.riskEval?.healthRiskLevel === "RED" || a.riskEval?.healthRiskLevel === "CRITICAL");
  }).length;

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <SectionTitle eyebrow="Administration" title="Farms Management">
        <button className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded font-bold hover:bg-teal-700 shadow-sm text-sm">
          <Plus size={16} /> Register Farm
        </button>
      </SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Registered Farms" value={totalFarms} icon={Building2} tone="teal" />
        <StatCard label="Active Operations" value={activeFarms} icon={Activity} tone="emerald" />
        <StatCard label="Farms with High-Risk Alerts" value={highRiskFarms} icon={Building2} tone="red" />
      </div>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Farm ID</th>
              <th className="px-4 py-3">Owner / Contact</th>
              <th className="px-4 py-3">District & Zone</th>
              <th className="px-4 py-3 text-right">Animals</th>
              <th className="px-4 py-3 text-center">Open Alerts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {farms.map(farm => {
              const farmAnimals = animals.filter(a => a.farmId === farm.id);
              const farmAlerts = alerts.filter(al => farmAnimals.some(a => a.id === al.animalId) && al.status === "OPEN");
              const hasCritical = farmAlerts.some(al => al.severity === "CRITICAL");
              
              return (
                <tr key={farm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{farm.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{farm.owner}</div>
                    <div className="text-xs text-slate-500">{farm.contact || "+91 XXXXX XXXXX"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin size={12} className="text-teal-600" /> {farm.district}
                    </div>
                    <div className="text-xs text-slate-500 ml-4">{farm.zone || "Zone A"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{farmAnimals.length}</td>
                  <td className="px-4 py-3 text-center">
                    {farmAlerts.length > 0 ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${hasCritical ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                        {farmAlerts.length}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold border border-emerald-200">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setPage("animals")}
                      className="text-teal-700 font-bold hover:underline text-xs"
                    >
                      View Herd
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
