import React, { useState, useEffect } from 'react';
import { Play, Square, User, Bell, Wifi, WifiOff, Menu } from 'lucide-react';
import { BRAND } from '../../utils/branding';

const ROLE_LABEL = { farmer: "Farmer", vet: "Veterinarian", district_official: "District Official", state_official: "State Official", official: "Official", field: "Field Worker", admin: "Administrator", lab: "Diagnostic Laboratory" };
const NAME_MAP = { farmer: "Omkar", vet: "Dr. Kulkarni", district_official: "District Officer", state_official: "State Officer", official: "Officer", field: "Field Worker", admin: "Admin", lab: "Lab Technician" };

export default function Topbar({ role, pageName, isRunning, toggleSimulation, openAlertCount, setPage, userName, onOpenMenu, demoStep }) {
  const shortName = userName || NAME_MAP[role] || "User";
  const userRole = ROLE_LABEL[role] || "User";
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shadow-sm z-20 shrink-0 w-full">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open Navigation Menu"
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0 transition-colors focus:outline-none"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Logo */}
        <div className="md:hidden flex items-center shrink-0">
          <div className="w-6 h-6 shrink-0">
            <img src={BRAND.logo} alt="PASHU-RAKSHA" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Page Title */}
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
          {pageName}
        </h2>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
        <div className="relative flex items-center justify-center">
          <button 
            type="button"
            onClick={toggleSimulation}
            title={isRunning ? "Stop Simulation" : "Start Simulated Telemetry"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0 relative z-10 ${
              isRunning 
                ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" 
                : "bg-amber-500 text-teal-950 border border-amber-600 hover:bg-amber-400"
            }`}
          >
            {isRunning ? <Square size={14} className="sm:w-4 sm:h-4" fill="currentColor" /> : <Play size={14} className="sm:w-4 sm:h-4" fill="currentColor" />}
            <span className="hidden sm:inline">{isRunning ? "Stop Simulation" : "Start Telemetry"}</span>
            <span className="sm:hidden">{isRunning ? "Stop" : "Sim"}</span>
          </button>

          {demoStep === 0 && !isRunning && (
            <div className="absolute top-full mt-3 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 w-[220px] sm:w-[260px] bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500 z-50 pointer-events-none border border-slate-700">
              <div className="absolute -top-2 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 w-4 h-4 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
              <h4 className="font-bold text-[14px] sm:text-[15px] mb-1.5 flex items-center gap-2 text-teal-400">
                <Play size={14} fill="currentColor" />
                Start the Demo
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-medium">
                Click <strong>Start Telemetry</strong> to begin the live simulated livestock-health workflow.
              </p>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 hidden xs:block"></div>
        
        {/* Online / Offline Status Badge */}
        {isOnline ? (
          <div 
            title="System Online"
            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700 shrink-0"
          >
            <Wifi size={13} className="shrink-0" />
            <span className="hidden sm:inline">Online</span>
          </div>
        ) : (
          <div 
            title="System Offline"
            className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-orange-700 animate-pulse shrink-0"
          >
            <WifiOff size={13} className="shrink-0" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}

        {/* Notifications / Alerts Button */}
        <button 
          type="button"
          className="relative text-slate-500 hover:text-slate-700 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          onClick={() => setPage && setPage('alerts')}
          title="View Alerts"
          aria-label="View Alerts"
        >
          <Bell size={18} />
          {openAlertCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-xs">
              {openAlertCount > 99 ? '99+' : openAlertCount}
            </span>
          )}
        </button>
        
        {/* User profile avatar (accessible on both mobile and desktop) */}
        <div 
          onClick={() => setPage && setPage('settings')}
          className="flex items-center gap-2 rounded-lg bg-slate-50 p-1 sm:px-3 sm:py-1.5 cursor-pointer border border-slate-200 hover:bg-slate-100 transition-colors shrink-0"
          title={`Signed in as ${shortName} (${userRole})`}
          role="button"
          tabIndex={0}
        >
          <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
            {userRole[0] || 'U'}
          </div>
          <div className="text-xs hidden md:block text-left">
            <div className="font-bold text-slate-700 leading-tight max-w-[100px] truncate">{shortName}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}