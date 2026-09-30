import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Stethoscope, ActivitySquare, CheckCircle2, AlertTriangle, 
  Warehouse, Eye, PhoneCall, FileText, Activity, MapPin, 
  RefreshCcw, ArrowRight, ShieldAlert, Thermometer, Clock, Syringe
} from 'lucide-react';
import { api } from '../../services/api/api';
import AddAnimalModal from './AddAnimalModal';

export default function FarmerDashboard({ liveData, setPage, role, actions, fieldMode }) {
  const [farms, setFarms] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [observations, setObservations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vaccStats, setVaccStats] = useState(null);
  
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [isAddAnimalOpen, setIsAddAnimalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fRes, aRes, oRes, alRes, vRes] = await Promise.all([
        api.farms.getAll().catch(() => ({ success: true, data: [] })),
        api.animals.getAll().catch(() => ({ success: true, data: [] })),
        api.observations.getAll().catch(() => ({ success: true, data: [] })),
        api.alerts.getAll().catch(() => ({ success: true, data: [] })),
        api.vaccination.getStats().catch(() => ({ success: true, data: { total: 0, upToDate: 0, dueSoon: 0, overdue: 0 } }))
      ]);

      const fList = Array.isArray(fRes) ? fRes : (fRes.data || []);
      const aList = Array.isArray(aRes) ? aRes : (aRes.data || []);
      const oList = Array.isArray(oRes) ? oRes : (oRes.data || []);
      const alList = Array.isArray(alRes) ? alRes : (alRes.data || []);
      
      setFarms(fList);
      setAnimals(aList);
      setObservations(oList);
      setAlerts(alList);
      setVaccStats(vRes.data || vRes);

      if (aList.length > 0) {
        const riskRank = { CRITICAL: 5, RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 };
        const sorted = [...aList].sort((a, b) => (riskRank[b.riskLevel] || 0) - (riskRank[a.riskLevel] || 0));
        setSelectedAnimal(sorted[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (selectedAnimal) {
      api.intelligence.getHealthFingerprint(selectedAnimal.id)
        .then(res => {
          setFingerprint(res.data || res);
        })
        .catch(err => {
          console.error('Failed to load fingerprint', err);
          setFingerprint(null);
        });
    }
  }, [selectedAnimal]);

  // Derived KPIs
  const totalAnimals = animals.length;
  const healthyCount = animals.filter(a => a.healthStatus === 'HEALTHY' || a.riskLevel === 'GREEN').length;
  const watchCount = animals.filter(a => a.healthStatus === 'WATCH' || ['YELLOW', 'ORANGE'].includes(a.riskLevel)).length;
  const criticalCount = animals.filter(a => ['SICK', 'ISOLATED'].includes(a.healthStatus) || ['RED', 'CRITICAL'].includes(a.riskLevel)).length;

  const healthyPct = totalAnimals ? ((healthyCount / totalAnimals) * 100).toFixed(1) : 0;
  const watchPct = totalAnimals ? ((watchCount / totalAnimals) * 100).toFixed(1) : 0;
  const criticalPct = totalAnimals ? ((criticalCount / totalAnimals) * 100).toFixed(1) : 0;

  const farm = farms[0];
  const recentAlert = alerts[0];

  // Radar helper
  const getRadarPoint = (val, min, max, axisIndex) => {
    const norm = Math.min(Math.max((val - min) / (max - min), 0), 1);
    const R = 110; 
    const cx = 160;
    const cy = 135;
    const angle = -Math.PI/2 + (axisIndex * 2 * Math.PI / 5);
    const x = cx + norm * R * Math.cos(angle);
    const y = cy + norm * R * Math.sin(angle);
    return `${x},${y}`;
  };

  const validObservations = useMemo(() => observations.filter(obs => animals.some(a => a.id === obs.animalId)), [observations, animals]);
  const currentObs = validObservations.find(o => o.animalId === selectedAnimal?.id) || null;
  const base = fingerprint?.baseline || { temperature: 38.5, activity: 80, feeding: 180, movement: 1500, rumination: 300 };
  const cur = currentObs || base;

  const bPts = [
    getRadarPoint(base.temperature || 38.5, 36, 42, 0),
    getRadarPoint(base.activity || 80, 0, 100, 1),
    getRadarPoint(base.feeding || 180, 0, 400, 2),
    getRadarPoint(base.movement || 1500, 0, 5000, 3),
    getRadarPoint(base.rumination || 300, 0, 600, 4)
  ].join(' ');

  const cPts = [
    getRadarPoint(cur.temperatureCelsius || base.temperature || 38.5, 36, 42, 0),
    getRadarPoint(cur.activityLevel || base.activity || 80, 0, 100, 1),
    getRadarPoint(cur.feedingMinutes || base.feeding || 180, 0, 400, 2),
    getRadarPoint(cur.movementMeters || base.movement || 1500, 0, 5000, 3),
    getRadarPoint(cur.ruminationMinutes || base.rumination || 300, 0, 600, 4)
  ].join(' ');

  const isHealthyCur = cur.temperatureCelsius < 39.5;

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 sm:space-y-6 md:space-y-8 pb-12 w-full animate-in fade-in duration-500">
      
      {/* GREETING & PRIMARY ACTIONS HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] uppercase tracking-wider font-semibold">{farm?.name || 'Herd Unit 01'}</span>
            <span className="text-slate-400 text-[13px]">•</span>
            <span className="text-slate-500 text-[12px] sm:text-[13px]">PASHU-RAKSHA Clinical Surveillance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-bold text-slate-900 tracking-tight font-display">Good morning, Farmer</h1>
          <p className="text-xs sm:text-[14px] text-slate-500">Monitor the health of your livestock and review important health events.</p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button className="flex-1 sm:flex-initial h-10 px-3.5 sm:px-4 rounded-lg bg-white border border-slate-200 text-teal-700 font-semibold text-xs sm:text-[14px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm" type="button" onClick={() => setIsAddAnimalOpen(true)}>
            <Plus size={16} />
            <span>Add Animal</span>
          </button>
          <button onClick={() => setPage('report')} className="flex-1 sm:flex-initial h-10 px-3.5 sm:px-4 rounded-lg bg-[#0d4733] text-white font-semibold text-xs sm:text-[14px] hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm" type="button">
            <Stethoscope size={16} />
            <span>Report Health Issue</span>
          </button>
        </div>
      </header>

      {/* 1. TOP KPI STATISTICS ROW */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        
        {/* Card 1: Total Animals */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-3 sm:gap-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Total Livestock</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 text-[#0d4733] flex items-center justify-center border border-emerald-100 shrink-0">
              <ActivitySquare size={18} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] sm:text-[26px] font-bold text-slate-900 font-mono">{loading ? '...' : totalAnimals}</span>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <Warehouse size={13} />
              <span className="text-xs sm:text-[13px] truncate">Across {farm?.name || 'authorized farms'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Healthy */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-3 sm:gap-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Healthy</span>
            <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Normal
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] sm:text-[26px] font-bold text-slate-900 font-mono">{loading ? '...' : healthyCount}</span>
              <span className="text-[11px] sm:text-[12px] text-green-600 font-semibold">{healthyPct}% of herd</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <CheckCircle2 size={13} className="text-green-600 shrink-0" />
              <span className="text-xs sm:text-[13px] truncate">Within normal baselines</span>
            </div>
          </div>
        </div>

        {/* Card 3: Needs Attention */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-3 sm:gap-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Needs Attention</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Elevated Risk
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] sm:text-[26px] font-bold text-slate-900 font-mono">{loading ? '...' : watchCount}</span>
              <span className="text-[11px] sm:text-[12px] text-amber-600 font-semibold">{watchPct}%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <Eye size={13} className="text-amber-500 shrink-0" />
              <span className="text-xs sm:text-[13px] truncate">{watchCount} under active watch</span>
            </div>
          </div>
        </div>

        {/* Card 4: Veterinary Review */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-3 sm:gap-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Veterinary Review</span>
            <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full bg-red-600 ${criticalCount > 0 ? 'animate-ping' : ''}`}></span> Urgent
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] sm:text-[26px] font-bold text-red-600 font-mono">{loading ? '...' : criticalCount}</span>
              <span className="text-[11px] sm:text-[12px] text-red-600 font-semibold">{criticalPct}%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <ShieldAlert size={13} className="text-red-600 shrink-0" />
              <span className="text-xs sm:text-[13px] truncate">Requires vet attention</span>
            </div>
          </div>
        </div>

      </section>

      {/* 2. TWO-COLUMN MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6 min-w-0">
          
          {/* LIVESTOCK HEALTH OVERVIEW & DISTRIBUTION */}
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-[20px] font-bold text-slate-900 font-display">Livestock Health Overview</h2>
                <span className="text-xs sm:text-[13px] text-slate-500">All {totalAnimals} Animals Evaluated Today against Individual Baselines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">PASHU Core v3.2</span>
              </div>
            </div>
            
            {/* Segmented Progress Bar */}
            <div className="w-full flex h-3 sm:h-3.5 rounded-full overflow-hidden bg-slate-100 p-0.5 gap-1 border border-slate-200">
              <div className="bg-green-500 rounded-full transition-all duration-1000 ease-out" style={{width: `${healthyPct}%`}} title={`Healthy: ${healthyCount}`}></div>
              <div className="bg-amber-500 rounded-full transition-all duration-1000 ease-out" style={{width: `${watchPct}%`}} title={`Needs Attention: ${watchCount}`}></div>
              <div className="bg-red-600 rounded-full transition-all duration-1000 ease-out" style={{width: `${criticalPct}%`}} title={`Veterinary Review: ${criticalCount}`}></div>
            </div>
            
            {/* Detailed Legend Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span className="text-xs sm:text-[13px] text-slate-900 font-medium">Healthy</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-[16px] font-bold text-slate-900">{healthyCount}</span>
                  <span className="text-[11px] text-slate-500">({healthyPct}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-xs sm:text-[13px] text-slate-900 font-medium">Needs Attention</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-[16px] font-bold text-slate-900">{watchCount}</span>
                  <span className="text-[11px] text-slate-500">({watchPct}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span className="text-xs sm:text-[13px] text-slate-900 font-medium">Veterinary Review</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-[16px] font-bold text-red-600">{criticalCount}</span>
                  <span className="text-[11px] text-slate-500">({criticalPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ALERTS PANEL */}
          {recentAlert && (
            <div className="p-4 sm:p-6 rounded-xl bg-red-50/50 border border-red-200 shadow-sm flex flex-col gap-3 sm:gap-4 animate-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span className="text-[11px] sm:text-[12px] text-red-700 uppercase tracking-wider font-bold">Recent Health Alerts</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-[10px] sm:text-[11px] font-bold">{alerts.length} Active Alerts</span>
              </div>
              
              <div className="p-3.5 sm:p-4 rounded-lg bg-white shadow-sm border border-slate-200 flex flex-col gap-3 sm:gap-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${recentAlert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 ml-1 sm:ml-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-white text-[10px] sm:text-[11px] font-bold tracking-wide ${recentAlert.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-600'}`}>POTENTIAL RISK</span>
                    <span className="text-sm sm:text-[16px] text-slate-900 font-bold">Animal {recentAlert.animalTag}</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">{new Date(recentAlert.createdAt).toLocaleString()}</span>
                </div>
                
                <div className="flex flex-col gap-2 flex-1 ml-1 sm:ml-2">
                  <div className="text-xs sm:text-[14px] text-slate-800 leading-snug break-words">
                    <span className="font-bold text-slate-900">{recentAlert.farmName}</span> — {recentAlert.message}
                  </div>
                  <div className="p-2 sm:p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-[12px] font-medium flex items-center gap-2 mt-0.5">
                    <ShieldAlert size={15} className="text-amber-600 shrink-0" />
                    <span>Medical Decision: Investigation recommended</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2 flex-wrap border-t border-slate-100 mt-1">
                  <button onClick={() => setPage('report')} className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs sm:text-[13px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                    <PhoneCall size={15} />
                    <span>Request Vet Visit</span>
                  </button>
                  <button onClick={() => setPage('animal-profile', recentAlert.animalId || recentAlert.animalTag)} className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-[#0d4733] text-white font-semibold text-xs sm:text-[13px] hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <FileText size={15} />
                    <span>View Animal Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INDIVIDUAL HEALTH FINGERPRINT CARD */}
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-[20px] font-bold text-slate-900 font-display">Individual Health Fingerprint — {selectedAnimal ? (selectedAnimal.tagId || selectedAnimal.id) : 'Loading...'}</h2>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 sm:mt-1">Individual baseline comparison (Last Observation vs Healthy Baseline)</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 border border-green-600"></span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-600">Baseline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isHealthyCur ? 'bg-teal-500' : 'bg-red-600'}`}></span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-600">Current Observation</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center min-h-[300px]">
              {loading ? (
                <div className="md:col-span-12 text-center text-slate-500 py-8">Loading fingerprint data...</div>
              ) : !fingerprint ? (
                <div className="md:col-span-12 text-center text-slate-500 py-8">Fingerprint data not available for this animal.</div>
              ) : (
                <>
                  <div className="md:col-span-6 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden w-full">
                    <svg className="w-full max-w-[270px] sm:max-w-[290px] h-auto overflow-visible" viewBox="-20 0 360 300">
                      <polygon fill="none" points="160,25 264,101 224,223 96,223 56,101" stroke="#E2E8F0" strokeWidth="1"></polygon>
                      <polygon fill="none" points="160,58 233,111 205,197 115,197 87,111" stroke="#E2E8F0" strokeWidth="1"></polygon>
                      <polygon fill="none" points="160,91 202,122 186,171 134,171 118,122" stroke="#CBD5E1" strokeDasharray="2,2" strokeWidth="1"></polygon>
                      
                      <line stroke="#CBD5E1" strokeWidth="1" x1="160" x2="160" y1="135" y2="25"></line>
                      <line stroke="#CBD5E1" strokeWidth="1" x1="160" x2="264" y1="135" y2="101"></line>
                      <line stroke="#CBD5E1" strokeWidth="1" x1="160" x2="224" y1="135" y2="223"></line>
                      <line stroke="#CBD5E1" strokeWidth="1" x1="160" x2="96" y1="135" y2="223"></line>
                      <line stroke="#CBD5E1" strokeWidth="1" x1="160" x2="56" y1="135" y2="101"></line>
                      
                      {/* Baseline Polygon */}
                      <polygon fill="#16A34A" fillOpacity="0.18" points={bPts} stroke="#16A34A" strokeWidth="2" className="transition-all duration-700"></polygon>
                      
                      {/* Current Polygon */}
                      <polygon fill={isHealthyCur ? "#14B8A6" : "#DC2626"} fillOpacity="0.25" points={cPts} stroke={isHealthyCur ? "#14B8A6" : "#DC2626"} strokeDasharray="4,3" strokeWidth="2.5" className="transition-all duration-700"></polygon>
                      
                      <text fill="#0F172A" fontSize="11" fontWeight="600" textAnchor="middle" x="160" y="15">Temperature</text>
                      <text fill="#0F172A" fontSize="11" fontWeight="600" textAnchor="start" x="268" y="105">Activity</text>
                      <text fill="#0F172A" fontSize="11" fontWeight="600" textAnchor="middle" x="235" y="242">Feeding</text>
                      <text fill="#0F172A" fontSize="11" fontWeight="600" textAnchor="middle" x="85" y="242">Movement</text>
                      <text fill="#0F172A" fontSize="11" fontWeight="600" textAnchor="end" x="52" y="105">Rumination</text>
                    </svg>
                  </div>
                  
                  <div className="md:col-span-6 flex flex-col gap-2 w-full">
                    <div className="p-2 sm:p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-900">1. Internal Temp</span>
                        <span className="text-[11px] sm:text-[12px] text-slate-500 font-mono">Norm: {(base.temperature || 38.5).toFixed(1)}°C | Cur: {cur.temperatureCelsius?.toFixed(1) || '--'}°C</span>
                      </div>
                    </div>
                    
                    <div className="p-2 sm:p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-900">2. Daily Activity</span>
                        <span className="text-[11px] sm:text-[12px] text-slate-500 font-mono">Norm: {base.activity || '--'}% | Cur: {cur.activityLevel || '--'}%</span>
                      </div>
                    </div>
                    
                    <div className="p-2 sm:p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-900">3. Feeding</span>
                        <span className="text-[11px] sm:text-[12px] text-slate-500 font-mono">Norm: {base.feeding || '--'}m | Cur: {cur.feedingMinutes || '--'}m</span>
                      </div>
                    </div>
                    
                    <div className="p-2 sm:p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-900">4. Movement</span>
                        <span className="text-[11px] sm:text-[12px] text-slate-500 font-mono">Norm: {base.movement || '--'}m | Cur: {cur.movementMeters || '--'}m</span>
                      </div>
                    </div>
                    
                    <div className="p-2 sm:p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-900">5. Rumination</span>
                        <span className="text-[11px] sm:text-[12px] text-slate-500 font-mono">Norm: {base.rumination || '--'}m | Cur: {cur.ruminationMinutes || '--'}m</span>
                      </div>
                    </div>
                    
                    <button disabled={!selectedAnimal?.id} onClick={() => selectedAnimal?.id && setPage('animal-profile', selectedAnimal.id)} className={`mt-2 w-full h-9 rounded-lg bg-[#0d4733] text-white font-semibold text-[13px] transition-colors flex items-center justify-center gap-1.5 shadow-sm ${!selectedAnimal?.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-900'}`}>
                      <FileText size={16} />
                      <span>View Animal Profile →</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RECENT CLINICAL & FIELD OBSERVATIONS TABLE */}
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div>
                <h2 className="text-base sm:text-[20px] font-bold text-slate-900 font-display">Recent Clinical & Field Observations</h2>
                <span className="text-xs sm:text-[13px] text-slate-500">Individual animal records from telemetry and veterinary rounds</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                <button onClick={() => setPage('animals')} className="px-3 py-1 rounded bg-white shadow-sm text-[#0d4733] text-[11px] font-bold border border-slate-200">View All Observations →</button>
              </div>
            </div>
            
            <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[580px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">Animal Tag</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">Farm / Location</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">Observation Note</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">Temp</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">Activity</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">Time</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-[13px] text-slate-800 divide-y divide-slate-100">
                  {validObservations.length === 0 ? (
                    <tr><td colSpan="7" className="py-6 text-center text-slate-500">No recent observations available.</td></tr>
                  ) : (
                    validObservations.slice(0, 3).map(obs => {
                      const anm = animals.find(a => a.id === obs.animalId);
                      const f = farms.find(f => f.id === anm?.farmId);
                      const isAlert = obs.temperatureCelsius > 39.5 || obs.activityLevel < 30;
                      return (
                        <tr key={obs.id} className={`hover:bg-slate-50 transition-all duration-300 ease-in-out cursor-pointer ${isAlert ? 'bg-red-50/20' : ''}`} onClick={() => setSelectedAnimal(anm)}>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                              <span className={`w-2 h-2 rounded-full ${isAlert ? 'bg-red-500' : 'bg-green-500'}`}></span>
                              <span>{anm?.tagId || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-500 font-medium">
                            {f?.name || 'Authorized Farm'}
                          </td>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold text-slate-900">{obs.notes || (isAlert ? 'Critical deviation' : 'Normal routine')}</td>
                          <td className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold font-mono ${isAlert ? 'text-red-600' : 'text-slate-700'}`}>{obs.temperatureCelsius}°C</td>
                          <td className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold font-mono ${isAlert ? 'text-red-600' : 'text-slate-700'}`}>{obs.activityLevel}%</td>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-500 font-mono text-[11px]">{new Date(obs.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                            <button onClick={(e) => { e.stopPropagation(); setPage('animal-profile', anm?.id); }} className="px-3 py-1 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition-colors">History</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-1">
              <span className="text-[11px] sm:text-[12px] text-slate-500">Showing {Math.min(3, validObservations.length)} of {validObservations.length} recent observations.</span>
            </div>
          </div>
          
        </div>
        
        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6 min-w-0">
          
          {/* SIMULATED TELEMETRY PANEL */}
          <div className="p-4 sm:p-6 rounded-xl bg-slate-900 text-white shadow-lg flex flex-col gap-3 sm:gap-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500 rounded-full blur-[40px] opacity-20"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <h2 className="text-base sm:text-[18px] font-bold font-display tracking-wide">Simulated Telemetry Feed</h2>
              <span className="px-2 py-0.5 rounded bg-blue-900 border border-blue-700 text-blue-300 text-[10px] font-bold uppercase tracking-wider">SIH DEMO</span>
            </div>
            
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-start gap-2 relative z-10">
              <Activity size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-[12px] text-slate-400 leading-snug">
                <span className="font-bold text-slate-200">DEMONSTRATION DATA:</span> Physical IoT hardware is not currently connected. Synthetic sensor telemetry is streamed.
              </p>
            </div>
          </div>

          {/* HERD VACCINATION STATUS CARD */}
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-[18px] font-bold text-slate-900 font-display">Herd Vaccination Status</h2>
              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Syringe size={16} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-[14px] text-slate-900 font-bold">{vaccStats?.upToDate || 0} Animals</span>
                    <span className="text-[11px] sm:text-[12px] text-slate-500">Up to Date</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Clock size={18} className="text-amber-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-[14px] text-slate-900 font-bold">{vaccStats?.dueSoon || 0} Animals</span>
                    <span className="text-[11px] sm:text-[12px] text-slate-500">Due Soon</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <AlertTriangle size={18} className="text-red-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-[14px] text-slate-900 font-bold">{vaccStats?.overdue || 0} Animal</span>
                    <span className="text-[11px] sm:text-[12px] text-red-600 font-medium">Overdue</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={() => setPage('vaccination')} className="w-full h-10 mt-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-[13px] hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
              <span>View Vaccination Records</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* FARM IDENTITY & LOCATION CARD */}
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-[18px] font-bold text-slate-900 font-display">Farm Identity & Location</h2>
                <span className="text-xs sm:text-[13px] text-slate-500">{farm?.code || 'FARM-PN-001'} • {farm?.district?.name || 'District'}</span>
              </div>
              <MapPin size={22} className="text-[#0d4733] shrink-0" />
            </div>
            
            {farm ? (
              <div className="w-full h-36 rounded-lg overflow-hidden relative border border-slate-200 flex items-end p-3 bg-emerald-50">
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#0d4733 1px, transparent 1px)', backgroundSize: '16px 16px'}}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d4733]/80 via-[#0d4733]/20 to-transparent"></div>
                <div className="relative z-10 flex flex-col w-full text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold truncate max-w-[70%]">{farm.address || 'Address not provided'}</span>
                    <span className="px-2 py-0.5 rounded bg-white/90 text-[#0d4733] text-[10px] font-bold shrink-0">Auth Area</span>
                  </div>
                  <span className="text-[11px] opacity-90 font-mono mt-1">{farm.latitude?.toFixed(4) || '18.5204'}° N, {farm.longitude?.toFixed(4) || '73.8567'}° E</span>
                  <button onClick={() => setPage('gis')} className="mt-2 self-start px-3 py-1 bg-[#0d4733]/80 hover:bg-[#0d4733] border border-white/20 rounded text-[11px] font-bold transition-colors">
                    Open Full Map →
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-36 rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
                {loading ? 'Loading map data...' : 'Map unavailable.'}
              </div>
            )}
          </div>

          {/* OFFLINE SYNC WIDGET */}
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCcw size={18} className={offline ? "text-orange-500" : "text-teal-600"} />
                <h2 className="text-base sm:text-[18px] font-bold text-slate-900 font-display">Field Sync Status</h2>
              </div>
              {!offline && <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>}
            </div>
            
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1">
              {offline ? (
                <div className="flex items-center gap-1.5 text-orange-700 font-bold text-xs sm:text-[13px]">
                  <Activity size={14} />
                  <span>Offline Mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs sm:text-[13px]">
                  <Activity size={14} />
                  <span>Online — Synced</span>
                </div>
              )}
            </div>
            
            <button onClick={() => setPage('sync')} className="h-10 mt-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-semibold text-xs sm:text-[13px] hover:bg-teal-100 transition-colors flex items-center justify-center gap-2">
              <RefreshCcw size={16} />
              <span>{offline ? 'View Queue' : 'Sync Now (Up to date)'}</span>
            </button>
          </div>
          
        </div>
      </div>
      
      <AddAnimalModal 
        isOpen={isAddAnimalOpen} 
        onClose={() => setIsAddAnimalOpen(false)} 
        onSuccess={(newAnimal) => {
          loadData(); // Re-fetch the data to include the new animal
          if (actions?.refresh) actions.refresh(); // Sync global state
        }} 
        farms={farms} 
      />
    </div>
  );
}