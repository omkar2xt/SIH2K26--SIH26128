import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, CheckCircle2, Clock, Database, Trash2 } from 'lucide-react';
import { Card, SectionTitle, StatCard } from '../common/UIComponents';
import { store } from '../../db/store';
import { offlineSync } from '../../db/offlineSync';
import { api } from '../../services/api/api';

export default function SyncCenter({ liveData, actions, offlineMode, pendingSync }) {
  const [syncing,   setSyncing]   = useState(false);
  const [message,   setMessage]   = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    offlineSync.getPendingQueue().then(setQueue);
  }, [liveData, offlineMode, syncing]);

  const auditLog = useMemo(() => store.getAll('auditLog').slice().reverse(), [liveData]);
  const pageSize = 15;
  const auditPage_ = auditLog.slice(auditPage * pageSize, (auditPage + 1) * pageSize);

  async function handleSync() {
    setSyncing(true);
    try {
      const currentQueue = await offlineSync.getPendingQueue();
      if (currentQueue.length > 0) {
        const res = await api.sync.push(currentQueue);
        if (res && res.syncResults) {
          for (const result of res.syncResults) {
            if (result.status === 'SYNCED') {
              await offlineSync.markOperationSynced(result.clientRef);
            } else {
              await offlineSync.markOperationFailed(result.clientRef, result.error || 'Failed');
            }
          }
          setMessage(`Synced ${res.syncedCount} queued operations.`);
        }
      } else {
        setMessage('No pending operations.');
      }
    } catch (err) {
      console.error(err);
      setMessage(`Sync failed: ${err.message}`);
    }
    setSyncing(false);
    setTimeout(() => setMessage(''), 3000);
  }

  function handleReset() {
    if (!window.confirm('Reset ALL data to seed state? This cannot be undone.')) return;
    actions.resetDB();
    offlineSync.clearQueue().then(() => setQueue([]));
    setMessage('Database reset to seed state.');
    setTimeout(() => setMessage(''), 3000);
  }

  const dbStats = useMemo(() => {
    const db = store.snapshot();
    return {
      animals: db.animals?.length || 0,
      farms: db.farms?.length || 0,
      cases: db.cases?.length || 0,
      alerts: db.alerts?.length || 0,
      vaccinations: db.vaccinations?.length || 0,
      labSamples: db.labSamples?.length || 0,
      observations: db.observations?.length || 0,
      auditLog: db.auditLog?.length || 0,
    };
  }, [liveData]);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Data Management" title="Sync Center & Audit Log" />

      {message && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800">{message}</div>
      )}

      {/* Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={`p-4 text-center ${offlineMode ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex justify-center mb-1">
            {offlineMode ? <WifiOff size={22} className="text-orange-600" /> : <Wifi size={22} className="text-emerald-600" />}
          </div>
          <div className={`text-sm font-bold ${offlineMode ? 'text-orange-800' : 'text-emerald-800'}`}>{offlineMode ? 'Offline' : 'Online'}</div>
          <div className="text-xs text-slate-500">Connection</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-black text-amber-800">{queue.length}</div>
          <div className="text-xs text-slate-500 font-semibold">Pending Sync</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-black text-slate-900">{dbStats.auditLog}</div>
          <div className="text-xs text-slate-500 font-semibold">Audit Entries</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-black text-teal-800">{dbStats.animals}</div>
          <div className="text-xs text-slate-500 font-semibold">Animals in DB</div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Sync Controls</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => {
            window.__FORCE_OFFLINE__ = !offlineMode;
            actions.toggleOffline();
          }} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold border ${offlineMode ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-orange-600 text-white border-orange-600'}`}>
            {offlineMode ? <><Wifi size={14} /> Go Online</> : <><WifiOff size={14} /> Simulate Offline</>}
          </button>
          <button onClick={handleSync} disabled={syncing || (!offlineMode && queue.length === 0)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-40">
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : `Sync Now (${queue.length})`}
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
            <Trash2 size={14} /> Reset DB to Seed
          </button>
        </div>
      </Card>

      {/* Pending queue */}
      {queue.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Queued Operations ({queue.length})</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {queue.map(q => (
              <div key={q.id} className="flex justify-between text-xs text-slate-700 border-b border-slate-100 py-1">
                <span className="font-semibold">{q.entityName} ({q.actionType})</span>
                <span className="font-semibold text-amber-600">{q.status}</span>
                <span className="text-slate-400">{new Date(q.queuedAt).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* DB stats */}
      <Card className="p-4">
        <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-1.5"><Database size={14} />Database Collections</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(dbStats).map(([k,v]) => (
            <div key={k} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
              <div className="text-lg font-black text-slate-900">{v}</div>
              <div className="text-[10px] font-semibold text-slate-500 capitalize">{k.replace(/([A-Z])/g,' $1')}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Audit log */}
      <Card className="p-0 overflow-x-auto">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Audit Log (latest first)</h3>
          <div className="flex gap-2">
            <button onClick={() => setAuditPage(p => Math.max(0,p-1))} disabled={auditPage===0} className="text-xs border rounded px-2 py-0.5 disabled:opacity-40">←</button>
            <span className="text-xs text-slate-500">Page {auditPage+1}</span>
            <button onClick={() => setAuditPage(p => (p+1)*pageSize < auditLog.length ? p+1 : p)} className="text-xs border rounded px-2 py-0.5">→</button>
          </div>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase text-slate-400 bg-slate-50">
            <tr><th className="px-4 py-2">Action</th><th className="px-4 py-2">Entity</th><th className="px-4 py-2">User</th><th className="px-4 py-2">Detail</th><th className="px-4 py-2">Timestamp</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditPage_.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono font-bold text-teal-800">{a.action}</td>
                <td className="px-4 py-2 text-slate-700">{a.entityId}</td>
                <td className="px-4 py-2 text-slate-500">{a.userId}</td>
                <td className="px-4 py-2 text-slate-500 max-w-[200px] truncate">{a.detail}</td>
                <td className="px-4 py-2 text-slate-400">{new Date(a.timestamp).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}