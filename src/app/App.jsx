import React, { useState, useCallback, useEffect } from 'react';
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
import DiseaseDetails from '../components/dashboard/DiseaseDetails';
import { useSimulation } from '../hooks/useSimulation';
import { api } from '../services/api/api';

const NAV = {
  farmer:   [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"animals", label:"My Animals", icon:"PawPrint" }, { id:"report", label:"Report Issue", icon:"FileText" }, { id:"vaccination", label:"Vaccination", icon:"Syringe" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  vet:      [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"cases", label:"Veterinary Cases", icon:"ClipboardList" }, { id:"animals", label:"Animals", icon:"PawPrint" }, { id:"risk", label:"Risk Monitor", icon:"ShieldAlert" }, { id:"exposure", label:"Exposure Intel", icon:"Network" }, { id:"gis", label:"GIS Map", icon:"MapPin" }, { id:"lab", label:"Laboratory", icon:"FlaskConical" }, { id:"diseases", label:"Disease KB", icon:"Database" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  district_official: [ { id:"dashboard", label:"District Dashboard", icon:"Home" }, { id:"gis", label:"GIS Intelligence", icon:"MapPin" }, { id:"clusters", label:"Health Trends", icon:"Layers" }, { id:"vaccination", label:"Vaccination Stats", icon:"Syringe" }, { id:"prevention", label:"Containment Zones", icon:"ShieldAlert" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  state_official: [ { id:"dashboard", label:"State Dashboard", icon:"Home" }, { id:"gis", label:"GIS Intelligence", icon:"MapPin" }, { id:"clusters", label:"Health Trends", icon:"Layers" }, { id:"vaccination", label:"Vaccination Stats", icon:"Syringe" }, { id:"prevention", label:"Containment Zones", icon:"ShieldAlert" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  field:    [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"animals", label:"Animals", icon:"PawPrint" }, { id:"report", label:"Observations", icon:"FileText" }, { id:"sync", label:"Offline Queue", icon:"RefreshCw" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  lab:      [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"lab", label:"Laboratory Orders", icon:"FlaskConical" }, { id:"alerts", label:"Alerts", icon:"Bell" } ],
  admin:    [ { id:"dashboard", label:"Dashboard", icon:"Home" }, { id:"animals", label:"Animals", icon:"PawPrint" }, { id:"farms", label:"Farms", icon:"Building2" }, { id:"diseases", label:"Disease KB", icon:"Database" }, { id:"sync", label:"System Monitor", icon:"RefreshCw" }, { id:"settings", label:"Settings", icon:"Settings" } ],
};

export default function App() {
  const { isRunning, toggleSimulation, liveData, demoStep, totalSteps, offlineMode, pendingSync, actions } = useSimulation();
  
  const [role,         setRole]         = useState(() => {
    const token = localStorage.getItem('pashuraksha_token');
    const savedRole = localStorage.getItem('pashuraksha_role');
    return (token && savedRole) ? savedRole : null;
  });
  const [page,         setPage]         = useState('dashboard');
  const [animalId,     setAnimalId]     = useState(null);
  const [diseaseId,    setDiseaseId]    = useState(null);
  const [userName,     setUserName]     = useState(() => {
    return localStorage.getItem('pashuraksha_username') || '';
  });
  const [gisAnimal,    setGisAnimal]    = useState(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unified navigation — supports setPage('animal-profile', 'MH-CAT-027'), setPage('gis', 'MH-BUF-009')
  const navigate = useCallback(async (targetPage, param = null) => {
    setMobileMenuOpen(false);
    if (targetPage === 'animal-profile' && param) {
      // Check if param is a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(param);
      if (!isUUID) {
        // We received a tagId instead of UUID. The backend strict validation expects a UUID.
        // We must convert tagId to UUID here in the router.
        try {
          // Resolve tag directly to UUID via backend
          const res = await api.animals.getById(param);
          if (res.success && res.data?.id) {
            setAnimalId(res.data.id);
            setPage(targetPage);
            if (window.location.hash !== `#/${targetPage}/${param}` && window.location.hash !== `#/${targetPage}/${res.data.id}`) {
              window.location.hash = `#/${targetPage}/${param}`;
            }
            return;
          }
        } catch (e) {
          console.error("Failed to map tagId to UUID in router:", e);
        }
      }
      setAnimalId(param);
      if (window.location.hash !== `#/${targetPage}/${param}`) window.location.hash = `#/${targetPage}/${param}`;
    } else if (targetPage === 'disease-details' && param) {
      setDiseaseId(param);
      if (window.location.hash !== `#/${targetPage}/${param}`) window.location.hash = `#/${targetPage}/${param}`;
    } else if (targetPage === 'gis') {
      setGisAnimal(param || null);
      if (param) {
        const hashTarget = `#/gis?animalTag=${encodeURIComponent(param)}`;
        if (window.location.hash !== hashTarget) window.location.hash = hashTarget;
      } else {
        if (window.location.hash !== '#/gis') window.location.hash = '#/gis';
      }
    } else {
      if (window.location.hash !== `#/${targetPage}`) window.location.hash = `#/${targetPage}`;
    }
    
    setPage(targetPage);
  }, []);

  // Sync state with URL hash for direct URL access (on initial load + hashchange events only)
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.slice(1); // remove '#'
      if (!rawHash) return;
      const [pathPart, queryPart] = rawHash.split('?');
      const parts = (pathPart || '').split('/').filter(Boolean);
      if (parts.length === 0) return;
      const targetPage = parts[0];
      const pathParam = parts[1] || null;

      const searchParams = new URLSearchParams(queryPart || '');
      const queryAnimal = searchParams.get('animalTag') || searchParams.get('animal');

      if (targetPage === 'gis') {
        navigate('gis', queryAnimal || pathParam);
        return;
      }

      navigate(targetPage, pathParam || queryAnimal);
    };

    // Only run on initial load once
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  const handleLogout = useCallback(() => { 
    localStorage.removeItem('pashuraksha_token');
    localStorage.removeItem('pashuraksha_role');
    localStorage.removeItem('pashuraksha_username');
    localStorage.removeItem('pashuraksha_sim_step');
    localStorage.removeItem('pashuraksha_sim_running');
    setRole(null); 
    setPage('dashboard'); 
    setAnimalId(null); 
    window.location.hash = '';
  }, []);

  // Validate stored token against backend on mount
  useEffect(() => {
    const token = localStorage.getItem('pashuraksha_token');
    if (token) {
      api.auth.me().then(res => {
        if (!res.success) {
          console.warn('[AUTH] Stored token invalid or expired. Resetting session.');
          handleLogout();
        } else if (res.data?.user) {
          const backendUser = res.data.user;
          const backendRole = backendUser?.role?.name || backendUser?.role;
          const roleMap = {
            'ADMIN': 'admin',
            'VETERINARIAN': 'vet',
            'FARMER': 'farmer',
            'FIELD_WORKER': 'field',
            'STATE_OFFICIAL': 'state_official',
            'DISTRICT_OFFICIAL': 'district_official',
            'DIAGNOSTIC_LABORATORY': 'lab'
          };
          const resolvedRole = roleMap[backendRole] || role;
          if (resolvedRole) {
            setRole(resolvedRole);
            localStorage.setItem('pashuraksha_role', resolvedRole);
          }
          const displayName = backendUser.fullName || backendUser.username;
          if (displayName) {
            setUserName(displayName);
            localStorage.setItem('pashuraksha_username', displayName);
          }
        }
      }).catch(() => {
        // Network offline; keep existing session
      });
    }

    const handleAuthExpired = () => {
      handleLogout();
    };
    window.addEventListener('pashuraksha_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('pashuraksha_auth_expired', handleAuthExpired);
  }, [handleLogout, role]);

  if (!role) {
    return <Landing onSelectRole={async (payload, submittedUsername, submittedPassword) => { 
      let username = '';
      let password = '';

      if (payload && typeof payload === 'object') {
        if (payload.demoRole) {
          const demoMap = {
            farmer:   { u: 'test_farmer_a',     p: 'hB5^nJ2$mD9@fX3*' },
            vet:      { u: 'dr_kulkarni',       p: 'tF3%kY8*wV1!zC6&' },
            lab:      { u: 'lab_tech_1',        p: 'qR8#vK4%pM7&gN2@' },
            admin:    { u: 'admin',             p: 'mX9$pQ2#rN7@vL4^' },
            official: { u: 'district_official', p: 'dO4$mK8#vL2@qW9*' },
            field:    { u: 'field_worker_1',    p: 'fW3^pK7$mD1@vX8*' },
          };
          const key = payload.demoRole.toLowerCase();
          const target = demoMap[key] || demoMap.farmer;
          username = target.u;
          password = target.p;
        } else {
          username = payload.username;
          password = payload.password;
        }
      } else {
        username = submittedUsername || payload;
        password = submittedPassword || 'Dev@1234';
      }

      try {
        const res = await api.auth.login(username, password);
        if (res.success && res.data?.token) {
          localStorage.setItem('pashuraksha_token', res.data.token);
          const backendUser = res.data.user;
          const backendRole = backendUser?.role?.name || backendUser?.role || 'FARMER';
          const roleMap = {
            'ADMIN': 'admin',
            'VETERINARIAN': 'vet',
            'FARMER': 'farmer',
            'FIELD_WORKER': 'field',
            'STATE_OFFICIAL': 'state_official',
            'DISTRICT_OFFICIAL': 'district_official',
            'DIAGNOSTIC_LABORATORY': 'lab'
          };
          const appRole = roleMap[backendRole] || 'farmer';
          const displayUser = backendUser?.fullName || backendUser?.username || 'User';

          localStorage.setItem('pashuraksha_role', appRole);
          localStorage.setItem('pashuraksha_username', displayUser);
          setRole(appRole); 
          setUserName(displayUser);
          setPage('dashboard'); 
          return { success: true };
        } else {
          return { success: false, error: res.error || 'Invalid credentials' };
        }
      } catch (e) {
        return { success: false, error: 'Cannot connect to backend API server at localhost:3000' };
      }
    }} />;
  }
  const currentNavLabel = NAV[role]?.find(n => n.id === page)?.label || (page === 'animal-profile' ? 'Animal Profile' : '—');

  // Compute open alert count for topbar badge
  const openAlertCount = (liveData.alerts || []).filter(a => a.status === 'OPEN').length;
  const demoActive = demoStep > 0 || isRunning;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Sidebar 
        role={role} 
        page={page} 
        setPage={navigate} 
        onLogout={handleLogout} 
        nav={NAV[role] || []} 
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Topbar 
          role={role}
          pageName={currentNavLabel}
          isRunning={isRunning}
          toggleSimulation={toggleSimulation}
          demoStep={demoStep}
          openAlertCount={openAlertCount}
          offlineMode={offlineMode}
          pendingSync={pendingSync}
          setPage={navigate}
          userName={userName}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
        
        {/* Simulation banner */}
        {(isRunning || demoStep > 0) && (
          <div className="bg-amber-100 border-b border-amber-200 text-amber-900 text-xs font-bold text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 shrink-0">
            <span>{isRunning ? '▶ SIMULATION RUNNING' : '⏸ SIMULATION PAUSED'} — Step {demoStep}/{totalSteps}</span>
            <div className="inline-flex items-center gap-1.5">
              <button onClick={actions.nextStep}  className="bg-amber-200 px-2 py-0.5 rounded hover:bg-amber-300">›</button>
              <button onClick={actions.prevStep}  className="bg-amber-200 px-2 py-0.5 rounded hover:bg-amber-300">‹</button>
              <button onClick={actions.resetDemo} className="text-amber-800 underline hover:text-amber-950 text-[11px]">Reset</button>
              <button onClick={toggleSimulation}  className={`px-2 py-0.5 rounded text-[11px] font-bold ${isRunning ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'}`}>
                {isRunning ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>
        )}

        {/* Offline banner */}
        {offlineMode && (
          <div className="bg-orange-100 border-b border-orange-200 text-orange-900 text-xs font-bold text-center py-1.5 px-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 shrink-0">
            <span>📡 OFFLINE MODE — {pendingSync} queued</span>
            <button onClick={actions.syncNow} className="bg-orange-200 px-2.5 py-0.5 rounded hover:bg-orange-300 text-[11px]">Sync Now</button>
            <button onClick={actions.toggleOffline} className="underline text-[11px]">Go Online</button>
          </div>
        )}
        
        <main key={`main-area-${demoActive}`} className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 bg-slate-50 min-w-0">
          {/* ── DASHBOARDS ─────────────────────────────────────────── */}
          {page === 'dashboard' && role === 'farmer'   && <FarmerDashboard liveData={liveData} setPage={navigate} role={role} actions={actions} />}
          {page === 'dashboard' && role === 'field'    && <FarmerDashboard liveData={liveData} setPage={navigate} role={role} actions={actions} fieldMode />}
          {page === 'dashboard' && role === 'vet'      && <VetDashboard    liveData={liveData} setPage={navigate} role={role} actions={actions} />}
          {page === 'dashboard' && (role === 'district_official' || role === 'state_official' || role === 'official') && <OfficialDashboard liveData={liveData} setPage={navigate} role={role} actions={actions} />}
          {page === 'dashboard' && role === 'admin'    && <AdminDashboard  liveData={liveData} setPage={navigate} role={role} actions={actions} />}
          {page === 'dashboard' && role === 'lab'      && <LaboratoryModule />}

          {/* ── ANIMALS ──────────────────────────────────────────── */}
          {page === 'animals' && (
            <AnimalsList liveData={liveData} setPage={navigate} role={role} actions={actions} />
          )}
          {page === 'animal-profile' && (
            <AnimalProfile liveData={liveData} setPage={navigate} animalId={animalId} actions={actions} role={role} />
          )}

          {/* ── FARMER / FIELD ────────────────────────────────────── */}
          {page === 'report' && (
            <ReportHealthIssue liveData={liveData} actions={actions} offlineMode={offlineMode} role={role} setPage={navigate} />
          )}

          {/* ── VET ───────────────────────────────────────────────── */}
          {page === 'cases' && (
            <VetCaseWorkflow setPage={navigate} />
          )}
          {page === 'lab' && (
            <LaboratoryModule setPage={navigate} />
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
          {page === 'disease-details' && (
            <DiseaseDetails diseaseId={diseaseId} liveData={liveData} setPage={navigate} />
          )}
          {page === 'vaccination' && (
            <VaccinationPage liveData={liveData} role={role} actions={actions} setPage={navigate} />
          )}
          {page === 'alerts' && (
            <ReportsAlerts liveData={liveData} actions={actions} setPage={navigate} />
          )}
          {page === 'gis' && (
            <GISDashboard 
              liveData={liveData} 
              isRunning={isRunning} 
              toggleSimulation={toggleSimulation} 
              demoStep={demoStep} 
              actions={actions} 
              setPage={navigate} 
              role={role} 
              focusAnimal={gisAnimal}
              onBackToAnimal={() => gisAnimal && navigate('animal-profile', gisAnimal)}
            />
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
            <Settings liveData={liveData} actions={actions} userName={userName} setUserName={setUserName} role={role} />
          )}

          {/* ── FALLBACK ──────────────────────────────────────────── */}
          {!['dashboard','animals','animal-profile','report','cases','lab','risk','exposure','diseases','disease-details','vaccination','prevention','gis','clusters','alerts','sync','farms','settings'].includes(page) && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <h2 className="text-xl font-bold mb-2">🚧 Page not found: {page}</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
