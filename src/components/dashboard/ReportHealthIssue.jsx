import React, { useState } from 'react';
import { SectionTitle, Card } from '../common/UIComponents';
import { Camera, Cpu, CloudOff, Cloud, RefreshCw } from 'lucide-react';

export default function ReportHealthIssue({ liveData, actions }) {
  const [offline, setOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [queued, setQueued] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (offline) {
      setQueued(q => q + 1);
    } else {
      actions.addReport({ type: "Manual", animalId: "MH-CAT-027", date: new Date().toISOString() });
      alert("Report submitted live!");
    }
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setQueued(0);
      alert("All offline reports synchronized to central database.");
    }, 1500);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle title="Report Health Issue" />
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setOffline(!offline)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${offline ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
          {offline ? <CloudOff size={16} /> : <Cloud size={16} />} {offline ? "Offline Mode Active" : "Online Mode Active"}
        </button>
        {queued > 0 && (
          <button onClick={handleSync} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-bold text-sm">
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} /> Sync {queued} Queued Reports
          </button>
        )}
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Select Animal</label>
            <select className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50">
              {liveData.animals.map(a => <option key={a.id} value={a.id}>{a.id} ({liveData.species.find(s=>s.id === a.speciesId)?.name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Primary Symptom</label>
            <input required type="text" className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="e.g. Reduced feeding, Lameness" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Detailed Observation</label>
            <textarea required rows="4" className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="Describe the health issue in detail..."></textarea>
          </div>
          <button type="submit" className="w-full px-4 py-3 bg-teal-800 text-white font-bold rounded hover:bg-teal-700">
            {offline ? "Save Offline to Queue" : "Submit Report"}
          </button>
        </form>
      </Card>
    </div>
  );
}
