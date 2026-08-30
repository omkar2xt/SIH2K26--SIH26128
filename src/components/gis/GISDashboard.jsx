import React, { useState, useEffect } from "react";
import GISMap from "./GISMap";
import { ShieldAlert, AlertTriangle, Search, Filter, Play, Pause, RefreshCw, Layers } from "lucide-react";

export default function GISDashboard({ liveData, isRunning, toggleSimulation, demoStep, actions, setPage }) { 
  const [geoData, setGeoData] = useState(null);
  
  // Layer toggles
  const [layers, setLayers] = useState({
    districtRisk: true,
    farms: true,
    animals: true,
    exposure: true,
    clusters: true,
    containment: true
  });

  // Load GeoJSON on mount
  useEffect(() => {
    fetch('/src/assets/geo/maharashtra-districts.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Failed to load map boundaries.", err));
  }, []);

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [search, setSearch] = useState("");

  const handleDistrictSelect = (name) => {
    setSelectedDistrict(name);
  };

  const handleFarmSelect = (farm) => {
    if (setPage) setPage('farms');
    else alert(`Navigating to Farm: ${farm.name}`);
  };

  const handleAnimalSelect = (id) => {
    if (setPage) setPage('animal-profile', id);
    else alert(`Navigating to Animal Profile: ${id}`);
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-slate-50">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="font-serif font-bold text-teal-900 flex items-center gap-2">
            <ShieldAlert size={20} />
            MAHARASHTRA SURVEILLANCE
          </div>
          <div className="flex gap-2 ml-4 border-l pl-4 border-slate-200">
            <select className="text-sm border border-slate-200 rounded p-1.5 bg-slate-50"><option>All Diseases</option><option>FMD</option></select>
            <select className="text-sm border border-slate-200 rounded p-1.5 bg-slate-50"><option>All Species</option><option>Cattle</option></select>
            <select className="text-sm border border-slate-200 rounded p-1.5 bg-slate-50"><option>All Risk</option><option>High Risk</option></select>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Animal or Farm..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded bg-slate-50 w-48"
            />
          </div>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 text-sm font-bold">
            LIVE SIMULATION (T-{Math.max(0, 15 - (demoStep || 0))}h)
            <button onClick={toggleSimulation} className="p-1 hover:bg-amber-200 rounded text-amber-900 ml-2">
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={actions?.nextStep} className="p-1 hover:bg-amber-200 rounded text-amber-900 text-xs px-2">Next</button>
            <button onClick={actions?.resetDemo} className="p-1 hover:bg-amber-200 rounded text-amber-900"><RefreshCw size={14} /></button>
          </div>
        </div>
      </div>

      {/* MAIN GIS AREA */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* Left: Map */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
          <div className="flex-1 relative z-0">
            <GISMap 
              geoData={geoData} 
              liveData={liveData} 
              layers={layers}
              onDistrictSelect={handleDistrictSelect}
              onFarmSelect={handleFarmSelect}
              onAnimalSelect={handleAnimalSelect}
            />
          </div>
          
          {/* Bottom Layers Bar */}
          <div className="p-3 bg-slate-800 text-white flex gap-4 text-xs font-semibold overflow-x-auto">
            <div className="flex items-center gap-1 opacity-50 mr-4"><Layers size={14} /> LAYERS</div>
            {Object.keys(layers).map(k => (
              <label key={k} className="flex items-center gap-1.5 cursor-pointer hover:text-teal-300">
                <input 
                  type="checkbox" 
                  checked={layers[k]} 
                  onChange={() => setLayers(l => ({...l, [k]: !l[k]}))}
                  className="accent-teal-500"
                /> 
                {k.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {/* Right: Intelligence Panel (Bottom Sheet on Mobile, Side Panel on Desktop) */}
        <div className={`
          absolute md:relative bottom-0 left-0 right-0 z-10 
          md:z-auto md:w-[350px] flex flex-col gap-4 
          transition-transform duration-300 ease-in-out
          ${selectedDistrict ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          bg-slate-100 md:bg-transparent p-4 md:p-0 rounded-t-2xl md:rounded-none shadow-2xl md:shadow-none
          max-h-[60vh] md:max-h-full overflow-y-auto
        `}>
          
          {/* Mobile Handle */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2 md:hidden" onClick={() => setSelectedDistrict(null)} />

          {selectedDistrict ? (
            (() => {
              const districtFarms = liveData.farms.filter(f => f.district === selectedDistrict);
              const farmIds = districtFarms.map(f => f.id);
              const districtAnimals = liveData.animals.filter(a => farmIds.includes(a.farmId));
              const animalIds = districtAnimals.map(a => a.id);
              const districtAlerts = liveData.alerts.filter(a => animalIds.includes(a.animalId));
              const districtExposure = (liveData.exposureEvents || []).filter(e => animalIds.includes(e.sourceId) || animalIds.includes(e.targetId));
              
              return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0">
                  <div className="flex justify-between items-start mb-3 border-b pb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedDistrict}</h3>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">District Intelligence</p>
                    </div>
                    <button onClick={() => setSelectedDistrict(null)} className="md:hidden p-1 bg-slate-100 rounded-full text-slate-500">X</button>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center"><span className="text-slate-600">Animals Monitored</span><span className="font-bold">{districtAnimals.length}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-600">Active Farms</span><span className="font-bold">{districtFarms.length}</span></div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center text-red-700 font-bold mb-2"><span>Open Alerts</span><span>{districtAlerts.length}</span></div>
                      <div className="flex justify-between items-center text-orange-700 font-bold mb-2"><span>Potential Exposure</span><span>{districtExposure.length}</span></div>
                    </div>
                    
                    <button 
                      onClick={() => alert(`View Cases feature for ${selectedDistrict} will be available in the Cases module.`)}
                      className="w-full mt-4 bg-teal-800 text-white font-bold py-2 rounded hover:bg-teal-700 transition-colors"
                    >
                      View Cases in {selectedDistrict}
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="hidden md:flex bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-col items-center justify-center text-center h-48 text-slate-500 text-sm shrink-0">
              <ShieldAlert size={32} className="text-slate-300 mb-3" />
              Click any district polygon on the map to view detailed regional intelligence.
            </div>
          )}

          {/* Active Workflows Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Simulation Events</h3>
            <div className="space-y-3">
              {liveData.cases.map(c => (
                <div key={c.id} className="p-3 bg-red-50 rounded-lg border border-red-100 text-sm">
                  <div className="font-bold text-red-900 mb-1">Vet Case: {c.id}</div>
                  <div className="text-xs text-red-700 font-semibold">{c.stage}</div>
                </div>
              ))}
              {liveData.containment?.map(c => (
                <div key={c.id} className="p-3 bg-slate-800 text-white rounded-lg border border-slate-900 text-sm">
                  <div className="font-bold mb-1">Containment: ACTIVE</div>
                  <div className="text-xs text-slate-300">{c.zone}</div>
                </div>
              ))}
              {liveData.cases.length === 0 && (
                <div className="text-slate-500 text-sm italic">Simulation currently at baseline. Press Play to trigger disease scenario.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  ); 
}