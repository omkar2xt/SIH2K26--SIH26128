import React, { useState, useCallback } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import Landing from '../components/layout/Landing';
import GISDashboard from '../components/gis/GISDashboard';
import VetDashboard from '../components/dashboard/VetDashboard';
import FarmerDashboard from '../components/dashboard/FarmerDashboard';
import OfficialDashboard from '../components/dashboard/OfficialDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import AnimalsList from '../components/dashboard/AnimalsList';
import AnimalProfile from '../components/dashboard/AnimalProfile';
import ReportHealthIssue from '../components/dashboard/ReportHealthIssue';
import VetCaseWorkflow from '../components/dashboard/VetCaseWorkflow';
import LaboratoryModule from '../components/dashboard/LaboratoryModule';
import ExposureIntelligence from '../components/dashboard/ExposureIntelligence';
import RiskMonitor from '../components/dashboard/RiskMonitor';
import DiseaseKnowledgeBase from '../components/dashboard/DiseaseKnowledgeBase';
import VaccinationPage from '../components/dashboard/VaccinationPage';
import PreventionControl from '../components/dashboard/PreventionControl';
import DiseaseTrendsClusters from '../components/dashboard/DiseaseTrendsClusters';
import ReportsAlerts from '../components/dashboard/ReportsAlerts';
import SyncCenter from '../components/offline/SyncCenter';
import Settings from '../components/dashboard/Settings';
import FarmsList from '../components/dashboard/FarmsList';
import { useSimulation } from '../hooks/useSimulation';

const NAV = {
  farmer:   [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"animals", label:"My Animals", icon:"PawPrint" }, { id:"report", label:"Report Issue", icon:"FileText" }, { id:"vaccination", label:"Vaccination", icon:"Syringe" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  vet:      [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"cases", label:"Veterinary Cases", icon:"ClipboardList" }, { id:"animals", label:"Animals", icon:"PawPrint" }, { id:"risk", label:"Risk Monitor", icon:"ShieldAlert" }, { id:"exposure", label:"Exposure Intel", icon:"Network" }, { id:"gis", label:"GIS Map", icon:"MapPin" }, { id:"lab", label:"Laboratory", icon:"FlaskConical" }, { id:"diseases", label:"Disease KB", icon:"Database" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  official: [ { id:"dashboard", label:"State Dashboard", icon:"Home" }, { id:"gis", label:"GIS Map", icon:"MapPin" }, { id:"clusters", label:"Disease Trends", icon:"Layers" }, { id:"vaccination", label:"Vaccination Coverage", icon:"Syringe" }, { id:"prevention", label:"Containment", icon:"ShieldAlert" }, { id:"alerts", label:"Reports & Alerts", icon:"Bell" } ],
  field:    [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"animals", label:"Animals", icon:"PawPrint" }, { id:"report", label:"Report Issue", icon:"FileText" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  admin:    [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"animals", label:"Animals", icon:"PawPrint" }, { id:"farms", label:"Farms", icon:"Building2" }, { id:"diseases", label:"Disease KB", icon:"Database" }, { id:"sync", label:"Sync Center", icon:"RefreshCw" }, { id:"settings", label:"Settings", icon:"Settings" } ],
};

export default function App() {
  const { isRunning, toggleSimulation, liveData, demoStep, totalSteps, offlineMode, pendingSync, actions } = useSimulation();
  
  const [role,         setRole]         = useState(null);
  const [page,         setPage]         = useState('dashboard');
  const [animalId,     setAnimalId]     = useState(null);

  // Unified navigation — supports setPage('animal-profile', 'MH-CAT-027')
  const navigate = useCallback((targetPage, param = null) => {
    setPage(targetPage);
    if (targetPage === 'animal-profile' && param) setAnimalId(param);
  }, []);

  if (!role) {
    return <Landing onSelectRole={(r) => { setRole(r); setPage('dashboard'); }} />;
  }

  const handleLogout = () => { setRole(null); setPage('dashboard'); setAnimalId(null); };
  const currentNavLabel = NAV[role]?.find(n => n.id === page)?.label || (page === 'animal-profile' ? 'Animal Profile' : '—');

  // Compute open alert count for topbar badge
  const openAlertCount = (liveData.alerts || []).filter(a => a.status === 'OPEN').length;

  return (
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Sidebar role={role} page={page} setPage={navigate} onLogout={handleLogout} nav={NAV[role] || []} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar 
          role={role}
          pageName={currentNavLabel}
          isRunning={isRunning}
          toggleSimulation={toggleSimulation}
          openAlertCount={openAlertCount}
          offlineMode={offlineMode}
          pendingSync={pendingSync}
        />
        
        {/* Simulation banner */}
        {(isRunning || demoStep > 0) && (
          <div className="bg-amber-100 border-b border-amber-200 text-amber-900 text-xs font-bold text-center py-1.5 flex items-center justify-center gap-3">
            {isRunning ? '▶ SIMULATION RUNNING' : '⏸ SIMULATION PAUSED'} — Step {demoStep}/{totalSteps}
            <button onClick={actions.nextStep}  className="bg-amber-200 px-2 py-0.5 rounded hover:bg-amber-300">›</button>
            <button onClick={actions.prevStep}  className="bg-amber-200 px-2 py-0.5 rounded hover:bg-amber-300">‹</button>
            <button onClick={actions.resetDemo} className="text-amber-800 underline hover:text-amber-950">Reset</button>
            <button onClick={toggleSimulation}  className={`px-2 py-0.5 rounded ${isRunning ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'}`}>
              {isRunning ? 'Pause' : 'Play'}
            </button>
          </div>
        )}

        {/* Offline banner */}
        {offlineMode && (
          <div className="bg-orange-100 border-b border-orange-200 text-orange-900 text-xs font-bold text-center py-1.5 flex items-center justify-center gap-3">
            📡 OFFLINE MODE — {pendingSync} reports queued
            <button onClick={actions.syncNow} className="bg-orange-200 px-3 py-0.5 rounded hover:bg-orange-300">Sync Now</button>
            <button onClick={actions.toggleOffline} className="underline">Go Online</button>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {/* ── DASHBOARDS ─────────────────────────────────────────── */}
          {page === 'dashboard' && role === 'farmer'   && <FarmerDashboard liveData={liveData} setPage={navigate} role={role} actions={actions} />}
          {page === 'dashboard' && role === 'field'    && <FarmerDashboard liveData={liveData} setPage={navigate} role={role} actions={actions} fieldMode />}
          {page === 'dashboard' && role === 'vet'      && <VetDashboard    liveData={liveData} setPage={navigate} role={role} actions={actions} />}
          {page === 'dashboard' && role === 'official' && <OfficialDashboard liveData={liveData} setPage={navigate} role={role} actions={actions} />}
          {page === 'dashboard' && role === 'admin'    && <AdminDashboard  liveData={liveData} setPage={navigate} role={role} actions={actions} />}

          {/* ── ANIMALS ──────────────────────────────────────────── */}
          {page === 'animals' && (
            <AnimalsList liveData={liveData} setPage={navigate} role={role} actions={actions} />
          )}
          {page === 'animal-profile' && (
            <AnimalProfile liveData={liveData} setPage={navigate} animalId={animalId} actions={actions} role={role} />
          )}

          {/* ── FARMER / FIELD ────────────────────────────────────── */}
          {page === 'report' && (
            <ReportHealthIssue liveData={liveData} actions={actions} offlineMode={offlineMode} role={role} />
          )}

          {/* ── VET ───────────────────────────────────────────────── */}
          {page === 'cases' && (
            <VetCaseWorkflow liveData={liveData} updateCaseStage={actions.updateCaseStage} actions={actions} />
          )}
          {page === 'lab' && (
            <LaboratoryModule liveData={liveData} addLabSample={actions.addLabSample} updateLabResult={actions.updateLabResult} />
          )}
          {page === 'risk' && (
            <RiskMonitor liveData={liveData} setPage={navigate} />
          )}
          {page === 'exposure' && (
            <ExposureIntelligence liveData={liveData} setPage={navigate} />
          )}

          {/* ── SHARED ────────────────────────────────────────────── */}
          {page === 'diseases' && (
            <DiseaseKnowledgeBase liveData={liveData} />
          )}
          {page === 'vaccination' && (
            <VaccinationPage liveData={liveData} role={role} actions={actions} />
          )}
          {page === 'alerts' && (
            <ReportsAlerts liveData={liveData} actions={actions} setPage={navigate} />
          )}
          {page === 'gis' && (
            <GISDashboard liveData={liveData} isRunning={isRunning} toggleSimulation={toggleSimulation} demoStep={demoStep} actions={actions} />
          )}

          {/* ── OFFICIAL ──────────────────────────────────────────── */}
          {page === 'clusters' && (
            <DiseaseTrendsClusters liveData={liveData} setPage={navigate} />
          )}
          {page === 'prevention' && (
            <PreventionControl liveData={liveData} actions={actions} setPage={navigate} />
          )}

          {/* ── ADMIN ─────────────────────────────────────────────── */}
          {page === 'farms' && (
            <FarmsList liveData={liveData} setPage={navigate} />
          )}
          {page === 'sync' && (
            <SyncCenter liveData={liveData} actions={actions} offlineMode={offlineMode} pendingSync={pendingSync} />
          )}
          {page === 'settings' && (
            <Settings liveData={liveData} actions={actions} />
          )}

          {/* ── FALLBACK ──────────────────────────────────────────── */}
          {!['dashboard','animals','animal-profile','report','cases','lab','risk','exposure','diseases','vaccination','prevention','gis','clusters','alerts','sync','farms','settings'].includes(page) && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <h2 className="text-xl font-bold mb-2">🚧 Page not found: {page}</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
