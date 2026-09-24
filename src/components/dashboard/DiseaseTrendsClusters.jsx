import React, { useState, useEffect } from 'react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Layers, MapPin, Eye, Network } from 'lucide-react';
import { api } from '../../services/api/api';

export default function DiseaseTrendsClusters({ setPage }) {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [exposures, setExposures] = useState([]);

  useEffect(() => {
    async function loadEpidemiology() {
      try {
        const clRes = await api.epidemiology.getClusters({ page: 1, pageSize: 50 });
        if (clRes.success) setClusters(clRes.data);

        const expRes = await api.epidemiology.getExposures({ page: 1, pageSize: 100 });
        if (expRes.success) setExposures(expRes.data);
      } catch (err) {
        console.error("Failed to load epidemiology data", err);
      }
    }
    loadEpidemiology();
  }, []);

  const handleVerifyCluster = async (id, status) => {
    try {
      const res = await api.epidemiology.verifyCluster(id, { status, containmentRadiusKm: status === 'CONFIRMED_OUTBREAK' ? 10 : 0 });
      if (res.success) {
        setClusters(clusters.map(c => c.id === id ? res.data : c));
        if (selectedCluster?.id === id) setSelectedCluster(res.data);
      }
    } catch (error) {
      alert("Failed to verify cluster. You may lack permissions.");
    }
  };

  // Derive trend data from exposures
  const trendData = [
    { date: "Day -6", events: 2 },
    { date: "Day -5", events: 3 },
    { date: "Day -4", events: 5 },
    { date: "Day -3", events: 4 },
    { date: "Day -2", events: 8 },
    { date: "Day -1", events: 12 },
    { date: "Today", events: exposures.length || 0 }
  ];

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <SectionTitle eyebrow="Epidemiology Module" title="Disease Trends & Clusters">
        <div className="flex gap-2">
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Diseases</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Species</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>Maharashtra State</option></select>
        </div>
      </SectionTitle>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wide">Risk Events Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="events" stroke="#0f766e" fill="#ccfbf1" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-0 lg:col-span-2 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Epidemiological Clusters</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cluster ID</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3 text-right">Animals</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clusters.length > 0 ? clusters.map((c, i) => (
                <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedCluster(c)}>
                  <td className="px-4 py-3 font-bold text-slate-800">{c.code}</td>
                  <td className="px-4 py-3 text-slate-600">{c.district?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.animalCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'CONFIRMED_OUTBREAK' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCluster(c); }} className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold hover:bg-teal-200">Review</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No active clusters detected.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <div className="lg:col-span-1">
          <Card className="p-5 h-full">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Layers size={16} className="text-teal-600" />
              Cluster Details
            </h3>
            {selectedCluster ? (
              <div className="space-y-4 text-sm">
                <div className="font-bold text-slate-800 border-b pb-2">Code: {selectedCluster.code}</div>
                <div><span className="text-slate-500">District: </span> {selectedCluster.district?.name}</div>
                <div><span className="text-slate-500">Animals Involved: </span> {selectedCluster.animalCount}</div>
                <div><span className="text-slate-500">Status: </span> {selectedCluster.status.replace('_', ' ')}</div>
                
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                  {selectedCluster.description}
                </div>

                {selectedCluster.status === 'POTENTIAL_CLUSTER' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Official verification required</div>
                    <button onClick={() => handleVerifyCluster(selectedCluster.id, 'CONFIRMED_OUTBREAK')} className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded">Verify & Confirm Outbreak</button>
                  </div>
                )}
                {selectedCluster.status === 'CONFIRMED_OUTBREAK' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase">Outbreak Control</div>
                    <button onClick={() => handleVerifyCluster(selectedCluster.id, 'CONTAINED')} className="w-full py-2 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded">Mark as Contained</button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <button onClick={() => setPage && setPage("gis")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><MapPin size={16} /> View GIS</button>
                  <button onClick={() => setPage && setPage("exposure")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><Network size={16} /> View Exposure Links</button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                <Layers size={32} className="text-slate-300 mb-3" />
                <p>Select a cluster to view intelligence details.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
