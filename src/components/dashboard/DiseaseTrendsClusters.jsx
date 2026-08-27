import React, { useState } from 'react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Layers, MapPin, Eye, Filter } from 'lucide-react';

export default function DiseaseTrendsClusters({ liveData, setPage }) {
  const [selectedCluster, setSelectedCluster] = useState(null);

  // Derive trend data from liveData exposure and alerts (demo projection)
  const trendData = [
    { date: "Day -6", events: 2 },
    { date: "Day -5", events: 3 },
    { date: "Day -4", events: 5 },
    { date: "Day -3", events: 4 },
    { date: "Day -2", events: 8 },
    { date: "Day -1", events: 12 },
    { date: "Today", events: liveData.alerts.length + (liveData.exposureEvents?.length || 0) }
  ];

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <SectionTitle eyebrow="Epidemiology Module" title="Disease Trends & Clusters">
        <div className="flex gap-2">
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Diseases</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Species</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>Maharashtra State</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>7 Days</option><option>30 Days</option></select>
        </div>
      </SectionTitle>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wide">Risk Events Trend <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2 normal-case">DEMO DATA</span></h3>
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
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Potential Clusters Detected</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cluster ID</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3 text-right">Animals</th>
                <th className="px-4 py-3">Dominant Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liveData.clusters?.length > 0 ? liveData.clusters.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">CLU_{c.district.substring(0,3).toUpperCase()}_{i+1}</td>
                  <td className="px-4 py-3 text-slate-600">{c.district}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.animalIds.length}</td>
                  <td className="px-4 py-3"><RiskBadge level={c.risk} /></td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase tracking-wider">Potential</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedCluster(c)} className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold hover:bg-teal-200">Review</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No active clusters detected in current state.</td></tr>
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
                <div className="font-bold text-slate-800 border-b pb-2">Cluster ID: CLU_{selectedCluster.district.substring(0,3).toUpperCase()}</div>
                <div><span className="text-slate-500">District: </span> {selectedCluster.district}</div>
                <div><span className="text-slate-500">Animals Involved: </span> {selectedCluster.animalIds.join(', ')}</div>
                <div><span className="text-slate-500">Dominant Abnormality: </span> {selectedCluster.dominantAbnormality}</div>
                <div><span className="text-slate-500">Risk: </span> {selectedCluster.risk}</div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <button onClick={() => setPage("gis")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><MapPin size={16} /> View GIS</button>
                  <button onClick={() => setPage("exposure")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><Network size={16} /> View Exposure Links</button>
                  <button onClick={() => setPage("animals")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><Eye size={16} /> View Animals</button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm text-center py-8">Select a cluster from the table to view epidemiological details.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
