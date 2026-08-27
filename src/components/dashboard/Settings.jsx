import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Smartphone, Globe, Sliders, Save, CheckCircle2 } from 'lucide-react';
import { SectionTitle, Card } from '../common/UIComponents';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [prefs, setPrefs] = useState({
    simSpeed: "Demo Mode (Manual Stepping)",
    autoReset: true,
    sensitivity: "Standard Sensitivity (Recommended)",
    theme: "light",
    notifications: true,
    language: "English"
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const tabs = [
    { id: 'general', label: 'General Preferences', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'offline', label: 'Offline Mode Config', icon: Smartphone }
  ];

  return (
    <div className="animate-in fade-in duration-300 space-y-6 max-w-4xl mx-auto relative">
      {/* Toast Notification */}
      {showSuccess && (
        <div className="absolute top-0 right-0 animate-in fade-in slide-in-from-top-4 flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-lg shadow-sm z-50 font-bold text-sm">
          <CheckCircle2 size={18} className="text-emerald-600" />
          Settings successfully saved!
        </div>
      )}

      <SectionTitle eyebrow="Administration" title="System Settings">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded font-bold transition-all shadow-sm ${
            isSaving ? "bg-slate-400 cursor-not-allowed" : "bg-teal-800 hover:bg-teal-700"
          }`}
        >
          <Save size={16} className={isSaving ? "animate-pulse" : ""} />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </SectionTitle>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Navigation / Tabs Sidebar */}
        <div className="space-y-2 md:col-span-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-l-4 transition-colors font-medium ${
                  isActive 
                    ? "bg-teal-50 text-teal-800 border-teal-800 font-bold" 
                    : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-300"
                }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="space-y-6 md:col-span-2">
          {activeTab === 'general' && (
            <>
              <Card className="p-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Simulation & Demo Engine</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Simulation Speed</label>
                    <select 
                      value={prefs.simSpeed}
                      onChange={e => setPrefs({...prefs, simSpeed: e.target.value})}
                      className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option>1x (Real-time)</option>
                      <option>10x (Accelerated)</option>
                      <option>Demo Mode (Manual Stepping)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Controls how fast the internal mock time advances during live simulations.</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={prefs.autoReset} 
                        onChange={e => setPrefs({...prefs, autoReset: e.target.checked})}
                        className="w-4 h-4 accent-teal-600" 
                      />
                      <span className="text-sm font-bold text-slate-700">Auto-reset simulation on logout</span>
                    </label>
                  </div>
                </div>
              </Card>

              <Card className="p-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Platform Preferences</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Default Risk Threshold</label>
                    <select 
                      value={prefs.sensitivity}
                      onChange={e => setPrefs({...prefs, sensitivity: e.target.value})}
                      className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option>Low Sensitivity</option>
                      <option>Standard Sensitivity (Recommended)</option>
                      <option>High Sensitivity (Early Warning)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Adjusts the baseline deviation tolerance for the AI Rule Engine.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Interface Theme</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="theme" checked={prefs.theme === 'light'} onChange={() => setPrefs({...prefs, theme: 'light'})} className="accent-teal-600" /> Light
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-400">
                        <input type="radio" name="theme" disabled className="accent-teal-600" /> Dark (Coming Soon)
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeTab !== 'general' && (
            <Card className="p-12 animate-in fade-in flex flex-col items-center justify-center text-center text-slate-500 h-full border-dashed">
              <SettingsIcon size={32} className="text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700 text-lg mb-2 capitalize">{activeTab} Settings</h3>
              <p className="text-sm">These settings are managed centrally by the district administrator and cannot be modified in the prototype environment.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
