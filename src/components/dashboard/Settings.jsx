import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Smartphone, Globe, Sliders, Save } from 'lucide-react';
import { SectionTitle, Card } from '../common/UIComponents';

export default function Settings() {
  return (
    <div className="animate-in fade-in duration-300 space-y-6 max-w-4xl mx-auto">
      <SectionTitle eyebrow="Administration" title="System Settings">
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded font-bold hover:bg-teal-700 transition-colors shadow-sm">
          <Save size={16} />
          Save Changes
        </button>
      </SectionTitle>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Navigation / Tabs Sidebar */}
        <div className="space-y-2 md:col-span-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-800 border-l-4 border-teal-800 font-bold text-sm text-left">
            <Sliders size={18} /> General Preferences
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium text-sm text-left border-l-4 border-transparent hover:border-slate-300">
            <Bell size={18} /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium text-sm text-left border-l-4 border-transparent hover:border-slate-300">
            <Shield size={18} /> Security & Access
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium text-sm text-left border-l-4 border-transparent hover:border-slate-300">
            <Globe size={18} /> Localization
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-medium text-sm text-left border-l-4 border-transparent hover:border-slate-300">
            <Smartphone size={18} /> Offline Mode Config
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6 md:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Simulation & Demo Engine</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Simulation Speed</label>
                <select className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none">
                  <option>1x (Real-time)</option>
                  <option>10x (Accelerated)</option>
                  <option selected>Demo Mode (Manual Stepping)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Controls how fast the internal mock time advances during live simulations.</p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-teal-600" />
                  <span className="text-sm font-bold text-slate-700">Auto-reset simulation on logout</span>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Platform Preferences</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Default Risk Threshold</label>
                <select className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none">
                  <option>Low Sensitivity</option>
                  <option selected>Standard Sensitivity (Recommended)</option>
                  <option>High Sensitivity (Early Warning)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Adjusts the baseline deviation tolerance for the AI Rule Engine.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Interface Theme</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="theme" defaultChecked className="accent-teal-600" /> Light
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-400">
                    <input type="radio" name="theme" disabled className="accent-teal-600" /> Dark (Coming Soon)
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
