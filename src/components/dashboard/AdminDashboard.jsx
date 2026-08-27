import React from 'react';
import { Settings as SettingsIcon, Server, Users, RefreshCw } from 'lucide-react';
import { SectionTitle, StatCard, Card } from '../common/UIComponents';

export default function AdminDashboard() {
  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle eyebrow="Administrator" title="System Status" />
      
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        <StatCard label="System Status" value="Online" icon={Server} tone="emerald" />
        <StatCard label="Active Users" value="1,240" icon={Users} tone="teal" />
        <StatCard label="Last Sync" value="2 min ago" icon={RefreshCw} tone="slate" />
        <StatCard label="Pending Updates" value="0" icon={SettingsIcon} tone="slate" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-900">System Logs</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-slate-600">[INFO] Database backup completed</span>
              <span className="text-xs text-slate-400">10:45 AM</span>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-slate-600">[INFO] Demo simulation triggered</span>
              <span className="text-xs text-slate-400">10:30 AM</span>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-slate-600">[WARN] High latency on GIS API</span>
              <span className="text-xs text-slate-400">09:15 AM</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}