import React, { useState, useEffect } from 'react';
import { Play, Square, User, Bell, Wifi, WifiOff } from 'lucide-react';
import { BRAND } from '../../utils/branding';

const ROLE_LABEL = { farmer: "Farmer", vet: "Veterinarian", official: "District/Government Official", field: "Field Worker", admin: "Administrator" };
const NAME_MAP = { farmer: "R. Deshmukh", vet: "Dr. A. Kulkarni", official: "D. Officer", field: "F. Worker", admin: "Admin" };

export default function Topbar({ role, pageName, isRunning, toggleSimulation, openAlertCount, setPage, userName }) {
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
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2 mr-2">
          <div className="w-6 h-6 shrink-0">
            <img src={BRAND.logo} alt="PASHU-RAKSHA" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{pageName}</h2>
      </div>
      
      <div className="flex items-center gap-6">
        <button 
          onClick={toggleSimulation}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
            isRunning 
              ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" 
              : "bg-amber-500 text-teal-950 border border-amber-600 hover:bg-amber-400"
          }`}
        >
          {isRunning ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          {isRunning ? "Stop Simulation" : "Start Live Simulation"}
        </button>

        <div className="h-6 w-px bg-slate-200"></div>
        
        <div className="flex items-center gap-4">
          {isOnline ? (
            <button className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
              <Wifi size={13} /> Online
            </button>
          ) : (
            <button className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700 animate-pulse">
              <WifiOff size={13} /> Offline
            </button>
          )}

          <button 
            className="relative text-slate-500 hover:text-slate-700"
            onClick={() => setPage && setPage('alerts')}
            title="View Alerts"
          >
            <Bell size={18} />
            {openAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                {openAlertCount > 99 ? '99+' : openAlertCount}
              </span>
            )}
          </button>
          
          <div 
            onClick={() => setPage && setPage('settings')}
            className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 sm:flex cursor-pointer border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {userRole[0]}
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-700 leading-tight">{shortName}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{userRole}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}