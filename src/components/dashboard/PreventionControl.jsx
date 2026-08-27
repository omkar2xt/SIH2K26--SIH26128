import React, { useState } from 'react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import { ShieldAlert, CheckCircle2, UserCheck, MapPin } from 'lucide-react';

export default function PreventionControl({ liveData, actions, setPage }) {
  const [selectedZone, setSelectedZone] = useState(null);

  const handleAction = (id, actionType) => {
    if (actions && actions.updateContainmentStatus) {
      actions.updateContainmentStatus(id, actionType);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <SectionTitle eyebrow="State Response & Containment" title="Containment Workflow" />
      
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-0 lg:col-span-2 overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Active Containment Zones</h3>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Zone ID</th>
                  <th className="px-4 py-3">District Details</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveData.containment?.length > 0 ? liveData.containment.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedZone(c)}>
                    <td className="px-4 py-3 font-bold text-slate-800">{c.id}</td>
                    <td className="px-4 py-3 text-slate-600">{c.zone}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'ACTIVE' ? 'bg-red-100 text-red-800' :
                        c.status === 'PROPOSED' ? 'bg-amber-100 text-amber-800' :
                        c.status === 'MONITORING' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'PROPOSED' && <button onClick={(e) => { e.stopPropagation(); handleAction(c.id, 'ACTIVE'); }} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-bold hover:bg-red-200">Activate</button>}
                      {c.status === 'ACTIVE' && <button onClick={(e) => { e.stopPropagation(); handleAction(c.id, 'MONITORING'); }} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold hover:bg-blue-200">Monitor</button>}
                      {c.status === 'MONITORING' && <button onClick={(e) => { e.stopPropagation(); handleAction(c.id, 'CLOSED'); }} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold hover:bg-emerald-200">Close</button>}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No active containment zones.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="lg:col-span-1 h-full">
          <Card className="p-5 h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-600" />
              Containment Details
            </h3>
            {selectedZone ? (
              <div className="space-y-4 text-sm flex-1">
                <div className="font-bold text-slate-800 border-b pb-2">{selectedZone.id}</div>
                <div><span className="text-slate-500 block text-xs mb-1">Zone definition:</span> {selectedZone.zone}</div>
                <div><span className="text-slate-500 block text-xs mb-1">Trigger reason:</span> {selectedZone.reason}</div>
                <div><span className="text-slate-500 block text-xs mb-1">Start Time:</span> {new Date(selectedZone.startTime).toLocaleString()}</div>
                <div><span className="text-slate-500 block text-xs mb-1">Status:</span> <span className="font-bold text-slate-700">{selectedZone.status}</span></div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <button onClick={() => setPage("gis")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><MapPin size={16} /> View GIS Map</button>
                  <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><UserCheck size={16} /> Assign Officer</button>
                  <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex justify-center items-center gap-2"><CheckCircle2 size={16} /> Mark Cleared</button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm text-center py-8">Select a containment zone to manage operations.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
