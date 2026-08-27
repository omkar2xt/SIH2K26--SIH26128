import React, { useState } from 'react';
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
import { useSimulation } from '../hooks/useSimulation';

const NAV = {
  farmer: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "report", label: "Report Issue", icon: "FileText" }, { id: "vaccination", label: "Vaccination", icon: "Syringe" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  vet: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "cases", label: "Veterinary Cases", icon: "ClipboardList" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "risk", label: "Risk Monitor", icon: "ShieldAlert" }, { id: "exposure", label: "Exposure Intelligence", icon: "Network" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "lab", label: "Laboratory", icon: "FlaskConical" }, { id: "diseases", label: "Disease Knowledge", icon: "Database" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  official: [ { id: "dashboard", label: "State Dashboard", icon: "Home" }, { id: "gis", label: "GIS Map", icon: "MapPin" }, { id: "clusters", label: "Disease Trends & Clusters", icon: "Layers" }, { id: "vaccination", label: "Vaccination Coverage", icon: "Syringe" }, { id: "prevention", label: "Containment", icon: "ShieldAlert" }, { id: "alerts", label: "Reports & Alerts", icon: "Bell" } ],
  field: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "report", label: "Report Issue", icon: "FileText" }, { id: "alerts", label: "Alerts", icon: "Bell" } ],
  admin: [ { id: "dashboard", label: "Dashboard", icon: "Home" }, { id: "animals", label: "Animals", icon: "PawPrint" }, { id: "farms", label: "Farms", icon: "Building2" }, { id: "diseases", label: "Disease Knowledge", icon: "Database" }, { id: "sync", label: "Sync Center", icon: "RefreshCw" }, { id: "settings", label: "Settings", icon: "SettingsIcon" } ],
};

export default function App() {
  const { isRunning, toggleSimulation, liveData, demoStep, actions } = useSimulation();
  
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("dashboard");

  if (!role) {
    return (
      <Landing onSelectRole={(r) => { 
        setRole(r); 
        setPage("dashboard"); 
      }} />
    );
  }

  const handleLogout = () => {
    setRole(null);
  };

  return (
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Sidebar role={role} page={page} setPage={setPage} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar 
          role={role} 
          pageName={NAV[role]?.find(n => n.id === page)?.label || "Dashboard"} 
          isRunning={isRunning} 
          toggleSimulation={toggleSimulation} 
        />
        
        {/* DEMO RUNNER INDICATOR */}
        {isRunning && (
          <div className="bg-amber-100 text-amber-800 text-xs font-bold text-center py-1">
            DEMO MODE RUNNING — Step {demoStep}/14
            <button onClick={actions.resetDemo} className="ml-4 text-amber-900 underline hover:text-amber-950">Reset Demo</button>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {page === "dashboard" && role === "farmer" && <FarmerDashboard liveData={liveData} />}
          {page === "dashboard" && role === "field" && <FarmerDashboard liveData={liveData} fieldMode />}
          {page === "dashboard" && role === "vet" && <VetDashboard liveData={liveData} setPage={setPage} />}
          {page === "dashboard" && role === "official" && <OfficialDashboard liveData={liveData} setPage={setPage} />}
          {page === "dashboard" && role === "admin" && <AdminDashboard liveData={liveData} />}
          
          {page === "animals" && <AnimalsList liveData={liveData} setPage={setPage} role={role} addAnimal={actions.addAnimal} />}
          {page === "animal-profile" && <AnimalProfile liveData={liveData} setPage={setPage} role={role} animalId="MH-CAT-027" />}
          {page === "report" && <ReportHealthIssue liveData={liveData} actions={actions} />}
          {page === "cases" && <VetCaseWorkflow liveData={liveData} updateCaseStage={actions.updateCaseStage} />}
          {page === "lab" && <LaboratoryModule liveData={liveData} addLabSample={actions.addLabSample} updateLabResult={actions.updateLabResult} />}
          {page === "risk" && <RiskMonitor liveData={liveData} setPage={setPage} />}
          {page === "exposure" && <ExposureIntelligence liveData={liveData} setPage={setPage} />}
          {page === "diseases" && <DiseaseKnowledgeBase liveData={liveData} />}
          {page === "vaccination" && <VaccinationPage liveData={liveData} role={role} />}
          {page === "prevention" && <PreventionControl liveData={liveData} actions={actions} setPage={setPage} />}
          {page === "clusters" && <DiseaseTrendsClusters liveData={liveData} setPage={setPage} />}
          {page === "alerts" && <ReportsAlerts liveData={liveData} actions={actions} setPage={setPage} />}
          
          {page === "gis" && <GISDashboard liveData={liveData} isRunning={isRunning} toggleSimulation={toggleSimulation} demoStep={demoStep} actions={actions} />}
          {page === "sync" && <SyncCenter liveData={liveData} />}
          {page === "farms" && <div className="p-8"><h2 className="text-xl font-bold mb-4">Farms Management</h2><p>Farms module active.</p></div>}
          {page === "settings" && <Settings />}

          {!["dashboard", "animals", "animal-profile", "report", "cases", "lab", "risk", "exposure", "diseases", "vaccination", "prevention", "gis", "clusters", "alerts", "sync", "farms", "settings"].includes(page) && (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <h2 className="text-xl font-bold mb-2">🚧 {page.toUpperCase()} under construction</h2>
              <p>This module is currently stubbed in the new architecture.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
