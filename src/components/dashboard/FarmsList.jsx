import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, Activity, Plus } from 'lucide-react';
import { SectionTitle, Card, StatCard, RiskBadge } from '../common/UIComponents';
import { api } from '../../services/api/api';

export default function FarmsList({ setPage }) {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadFarms() {
      setLoading(true);
      setError(null);
      const res = await api.farms.getAll();
      if (res.success) {
        setFarms(res.data);
      } else {
        setError(res.error || 'Failed to load farms from backend');
      }
      setLoading(false);
    }
    loadFarms();
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

  const totalFarms = farms.length;
  const activeFarms = totalFarms;
  const highRiskFarms = farms.filter(f => {
    const farmAnimals = f.animals || [];
    return farmAnimals.some(a => a.riskLevel === "RED" || a.riskLevel === "CRITICAL");
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

      {farms.length === 0 ? (
        <Card className="p-10 text-center text-slate-500 border-dashed">
          <p className="font-semibold">No farms found.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Farm ID</th>
                <th className="px-4 py-3">Owner / Contact</th>
                <th className="px-4 py-3">District & Zone</th>
                <th className="px-4 py-3 text-right">Animals</th>
                <th className="px-4 py-3 text-center">Risk Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {farms.map(farm => {
                const farmAnimals = farm.animals || [];
                const hasCritical = farmAnimals.some(a => a.riskLevel === "CRITICAL");
                const hasRed = farmAnimals.some(a => a.riskLevel === "RED");
                
                return (
                  <tr key={farm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{farm.code || farm.id.slice(0,8)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{farm.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin size={12} className="text-teal-600" /> {farm.district?.name || farm.districtId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{farmAnimals.length}</td>
                    <td className="px-4 py-3 text-center">
                      {(hasCritical || hasRed) ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${hasCritical ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                          {hasCritical ? 'Critical' : 'High Risk'}
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
      )}
    </div>
  );
}
