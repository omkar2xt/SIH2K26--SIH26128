import React from 'react';
import { 
  Home, MapPin, Layers, Bell, Activity, ShieldAlert, FileText, Syringe, 
  ClipboardList, Network, FlaskConical, Database, PawPrint, Building2, 
  RefreshCw, Settings as SettingsIcon, LogOut, X 
} from 'lucide-react';
import { BRAND } from '../../utils/branding';

const ICONS = {
  Home, MapPin, Layers, Bell, ShieldAlert, FileText, Syringe, ClipboardList, 
  Network, FlaskConical, Database, PawPrint, Building2, RefreshCw, SettingsIcon,
  Settings: SettingsIcon
};

const DEFAULT_NAV = {
  farmer: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "report", label: "Report Issue", icon: "FileText" }, { id: "vaccination", label: "Vaccination", icon: "Syringe" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  vet: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "cases", label: "Veterinary Cases", icon: "ClipboardList" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "risk", label: "Risk Monitor", icon: "ShieldAlert" }, { id: "exposure", label: "Exposure Intelligence", icon: "Network" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "lab", label: "Laboratory", icon: "FlaskConical" }, { id: "diseases", label: "Disease Knowledge", icon: "Database" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  district_official: [ { id: "dashboard", label: "District Dashboard", icon: "Home" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "clusters", label: "Disease Trends", icon: "Layers" }, { id: "vaccination", label: "Vaccination Stats", icon: "Syringe" }, { id: "prevention", label: "Containment", icon: "ShieldAlert" }, { id: "alerts", label: "Reports & Alerts", icon: "Bell" } ],
  state_official: [ { id: "dashboard", label: "State Dashboard", icon: "Home" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "clusters", label: "Disease Trends", icon: "Layers" }, { id: "vaccination", label: "Vaccination Stats", icon: "Syringe" }, { id: "prevention", label: "Containment", icon: "ShieldAlert" }, { id: "alerts", label: "Reports & Alerts", icon: "Bell" } ],
  official: [ { id: "dashboard", label: "State Dashboard", icon: "Home" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "clusters", label: "Disease Trends", icon: "Layers" }, { id: "vaccination", label: "Vaccination Coverage", icon: "Syringe" }, { id: "prevention", label: "Containment", icon: "ShieldAlert" }, { id: "alerts", label: "Reports & Alerts", icon: "Bell" } ],
  field: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "report", label: "Observations", icon: "FileText" }, { id: "sync", label: "Offline Queue", icon: "RefreshCw" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  lab: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "lab", label: "Laboratory Orders", icon: "FlaskConical" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  admin: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "farms", label: "Farms", icon: "Building2" }, { id: "diseases", label: "Disease Knowledge", icon: "Database" }, { id: "sync", label: "Sync Center", icon: "RefreshCw" }, { id: "settings", label: "Settings", icon: "SettingsIcon" } ],
};

const ROLE_LABEL = { 
  farmer: "Farmer", 
  vet: "Veterinarian", 
  district_official: "District Official",
  state_official: "State Official",
  official: "District/Government Official", 
  field: "Field Worker", 
  lab: "Diagnostic Laboratory",
  admin: "Administrator" 
};

export default function Sidebar({ role, page, setPage, onLogout, nav, mobileOpen, onClose }) {
  const navItems = (nav && nav.length > 0) ? nav : (DEFAULT_NAV[role] || []);

  const handleNavClick = (id) => {
    setPage(id);
    if (onClose) onClose();
  };

  const navContent = (
    <>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-teal-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-1 w-9 h-9 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <img src={BRAND.logo} alt={`${BRAND.name} logo`} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">{BRAND.name}</h1>
            <div className="text-[10px] uppercase tracking-wider text-teal-300 font-semibold">{ROLE_LABEL[role] || role}</div>
          </div>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="md:hidden p-1.5 text-teal-300 hover:text-white hover:bg-teal-900 rounded-lg transition-colors"
            aria-label="Close Navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] || Home;
          const isActive = page === item.id;
          return (
            <button 
              key={item.id} 
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left min-h-[42px] ${
                isActive 
                  ? "bg-teal-800 text-white font-bold shadow-sm" 
                  : "text-teal-100/80 hover:bg-teal-900 hover:text-white"
              }`}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? "text-emerald-400" : "text-teal-300"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer - Logout / Role Switch */}
      <div className="p-3 border-t border-teal-800/60 mt-auto">
        <button 
          type="button"
          onClick={() => {
            if (onClose) onClose();
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-teal-200/80 hover:bg-teal-900 hover:text-white transition-colors min-h-[42px]"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Switch role</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar: Always visible on md+ */}
      <aside className="hidden md:flex md:w-64 bg-teal-950 text-white flex-col h-screen border-r border-teal-900 shadow-xl z-30 shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
            onClick={onClose} 
            aria-hidden="true"
          />
          {/* Slide-out Drawer */}
          <aside className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-teal-950 text-white flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-250">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}