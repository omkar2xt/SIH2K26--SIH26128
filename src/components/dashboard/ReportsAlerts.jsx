import React, { useState } from 'react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import { AlertTriangle, MapPin, Eye, FileText, Download } from 'lucide-react';

export default function ReportsAlerts({ liveData, actions, setPage }) {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredAlerts = liveData.alerts.filter(a => {
    if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
    if (filterSeverity !== "ALL" && a.severity !== filterSeverity) return false;
    if (search) {
      if (!a.id.toLowerCase().includes(search.toLowerCase()) && 
          !a.animalId.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const handleAction = (alertId, actionType) => {
    if (actions && actions.updateAlertStatus) {
      if (actionType === "ACKNOWLEDGE") actions.updateAlertStatus(alertId, "ACKNOWLEDGED");
      if (actionType === "RESOLVE") actions.updateAlertStatus(alertId, "RESOLVED");
    }
  };

  const generateReport = () => {
    alert("Report generation preview:\n\n" +
      "Maharashtra Livestock Situation Report\n" +
      `Active Alerts: ${liveData.alerts.length}\n` +
      `Potential Clusters: ${liveData.clusters?.length || 0}\n` +
      `High Risk Animals: ${liveData.animals.filter(a => a.riskEval?.healthRiskLevel === "RED").length}\n\n` +
      "(DEMO DATA)"
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle eyebrow="District & State Control Room" title="Reports & Alerts">
        <button onClick={generateReport} className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700">
          <Download size={16} /> Generate Report
        </button>
      </SectionTitle>

      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <select 
          value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="p-2 border border-slate-200 rounded text-sm bg-slate-50"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical Only</option>
          <option value="RED">Red Only</option>
          <option value="ORANGE">Orange Only</option>
        </select>
        
        <select 
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="p-2 border border-slate-200 rounded text-sm bg-slate-50"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        
        <input 
          type="text" placeholder="Search Alert ID or Animal ID..." 
          value={search} onChange={e => setSearch(e.target.value)}
          className="p-2 border border-slate-200 rounded text-sm bg-slate-50 flex-1 min-w-[200px]"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-0 lg:col-span-2 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Alert ID</th>
                <th className="px-4 py-3">Time / Date</th>
                <th className="px-4 py-3">Animal</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length > 0 ? filteredAlerts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{a.id}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{a.animalId}</td>
                  <td className="px-4 py-3"><RiskBadge level={a.severity} /></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      a.status === 'OPEN' ? 'bg-red-100 text-red-800' : 
                      a.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-800' : 
                      'bg-slate-100 text-slate-600'
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {a.status === 'OPEN' && (
                      <button onClick={() => handleAction(a.id, "ACKNOWLEDGE")} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold hover:bg-amber-200">Ack</button>
                    )}
                    {a.status !== 'RESOLVED' && (
                      <button onClick={() => handleAction(a.id, "RESOLVE")} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold hover:bg-emerald-200">Resolve</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No verified records in selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <div className="space-y-4 lg:col-span-1">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Latest Critical Alert Details
            </h3>
            {filteredAlerts.length > 0 ? (
              <div className="space-y-4 text-sm">
                <div className="font-bold text-slate-800 border-b pb-2">{filteredAlerts[0].id}</div>
                <div><span className="text-slate-500">WHAT: </span> Health abnormality detected via algorithm</div>
                <div><span className="text-slate-500">WHERE: </span> {liveData.farms.find(f => f.id === liveData.animals.find(an => an.id === filteredAlerts[0].animalId)?.farmId)?.district || "Unknown District"}</div>
                <div><span className="text-slate-500">WHEN: </span> {new Date(filteredAlerts[0].createdAt).toLocaleString()}</div>
                <div><span className="text-slate-500">WHO: </span> Animal {filteredAlerts[0].animalId}</div>
                <div><span className="text-slate-500">RISK: </span> {filteredAlerts[0].severity}</div>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <button onClick={() => setPage("gis")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><MapPin size={16} /> View GIS</button>
                  <button onClick={() => setPage("cases")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><FileText size={16} /> View Case</button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm text-center py-8">Select an alert to view detailed geographic and epidemiological context.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
