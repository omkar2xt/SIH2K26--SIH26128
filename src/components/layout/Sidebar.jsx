import React from 'react';
import { Home, MapPin, Layers, Bell, Activity, ShieldAlert, FileText, Syringe, ClipboardList, Network, FlaskConical, Database, PawPrint, Building2, RefreshCw, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { BRAND } from '../../utils/branding';

const ICONS = {
  Home, MapPin, Layers, Bell, ShieldAlert, FileText, Syringe, ClipboardList, Network, FlaskConical, Database, PawPrint, Building2, RefreshCw, SettingsIcon
};

const NAV = {
  farmer: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "report", label: "Report Issue", icon: "FileText" }, { id: "vaccination", label: "Vaccination", icon: "Syringe" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  vet: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "cases", label: "Veterinary Cases", icon: "ClipboardList" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "risk", label: "Risk Monitor", icon: "ShieldAlert" }, { id: "exposure", label: "Exposure Intelligence", icon: "Network" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "lab", label: "Laboratory", icon: "FlaskConical" }, { id: "diseases", label: "Disease Knowledge", icon: "Database" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  official: [ { id: "dashboard", label: "State Dashboard", icon: "Home" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "clusters", label: "Disease Trends & Clusters", icon: "Layers" }, { id: "vaccination", label: "Vaccination Coverage", icon: "Syringe" }, { id: "prevention", label: "Containment", icon: "ShieldAlert" }, { id: "alerts", label: "Reports & Alerts", icon: "Bell" } ],
  field: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "report", label: "Report Issue", icon: "FileText" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  admin: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "farms", label: "Farms", icon: "Building2" }, { id: "diseases", label: "Disease Knowledge", icon: "Database" }, { id: "sync", label: "Sync Center", icon: "RefreshCw" }, { id: "settings", label: "Settings", icon: "SettingsIcon" } ],
};

const ROLE_LABEL = { farmer: "Farmer", vet: "Veterinarian", official: "District/Government Official", field: "Field Worker", admin: "Administrator" };

export default function Sidebar({ role, page, setPage, onLogout }) {
  const navItems = NAV[role] || [];

  return (
    <div className="w-full md:w-64 bg-teal-950 text-white flex md:flex-col h-auto md:h-screen border-t md:border-r md:border-t-0 border-teal-900 shadow-xl z-50 shrink-0">
      
      {/* Header - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-teal-800/60">
        <div className="bg-white rounded p-1 w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden">
          <img src={BRAND.logo} alt={`${BRAND.name} logo`} className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white">{BRAND.name}</h1>
          <div className="text-[10px] uppercase tracking-wider text-teal-300">{ROLE_LABEL[role]}</div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 md:px-3 md:py-4 flex flex-row md:flex-col justify-around md:justify-start gap-1 overflow-x-auto md:overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <button 
              key={item.id} 
              onClick={() => setPage(item.id)}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 py-2 md:px-3 md:py-2.5 rounded-lg text-[10px] md:text-sm font-medium transition-colors min-w-[60px] md:w-full ${
                page === item.id ? "bg-teal-800 text-white" : "text-teal-100/80 hover:bg-teal-900"
              }`}
            >
              {Icon && <Icon size={20} className="md:w-[17px] md:h-[17px]" />}
              <span className="hidden md:inline">{item.label}</span>
              <span className="md:hidden text-center leading-tight">
                {item.label.split(' ')[0]} {/* Shorten label on mobile */}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer - Logout - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block p-3 border-t border-teal-800/60">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-teal-200/70 hover:bg-teal-900 transition-colors"
        >
          <LogOut size={16} />
          Switch role
        </button>
      </div>
    </div>
  );
}