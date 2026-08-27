import React, { useState } from 'react';
import { RefreshCw, Database, CloudOff, Cloud, CheckCircle2, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import { SectionTitle, Card, StatCard } from '../common/UIComponents';

export default function SyncCenter({ liveData }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  const pendingRecords = 
    liveData.alerts.length + 
    liveData.cases.filter(c => c.stage === "Field Review").length;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync(new Date().toLocaleTimeString());
    }, 2000);
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6 max-w-5xl mx-auto">
      <SectionTitle 
        eyebrow="Offline Operations" 
        title="Data Synchronization Center"
      >
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-white transition-all shadow-sm ${
            isSyncing ? "bg-slate-400 cursor-not-allowed" : "bg-teal-800 hover:bg-teal-700"
          }`}
        >
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing ? "Syncing to Cloud..." : "Force Sync Now"}
        </button>
      </SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label="Network Status" 
          value="Online" 
          icon={Cloud} 
          tone="emerald" 
        />
        <StatCard 
          label="Pending Sync Queue" 
          value={isSyncing ? 0 : pendingRecords} 
          icon={Database} 
          tone="orange" 
        />
        <StatCard 
          label="Last Synced" 
          value={lastSync} 
          icon={CheckCircle2} 
          tone="teal" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowUpCircle className="text-teal-700" size={20} />
            Outbound Data Queue
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded text-sm">
              <span className="font-semibold text-slate-700">Field Observations</span>
              <span className="font-bold">{isSyncing ? 0 : 12} records</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded text-sm">
              <span className="font-semibold text-slate-700">Case Updates</span>
              <span className="font-bold">{isSyncing ? 0 : liveData.cases.filter(c => c.stage === "Field Review").length} records</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded text-sm">
              <span className="font-semibold text-slate-700">New Alerts</span>
              <span className="font-bold">{isSyncing ? 0 : liveData.alerts.length} records</span>
            </div>
            {pendingRecords === 0 && !isSyncing && (
              <div className="text-center text-slate-500 py-4 text-sm font-medium">All data is synchronized with the central server.</div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-amber-200 bg-amber-50">
          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-amber-600" size={20} />
            Offline Mode Capabilities
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed mb-4">
            The platform is designed to operate seamlessly in areas with low or no connectivity. When offline:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-amber-900">
            <li>Field workers can still record observations and risk assessments.</li>
            <li>Local risk evaluations run on cached rule engines.</li>
            <li>Data is securely stored on the device until connection is restored.</li>
            <li>Background sync automatically pushes data when network is available.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}