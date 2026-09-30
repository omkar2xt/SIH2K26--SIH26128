import React, { useState, useEffect } from "react";
import GISMap from "./GISMap";
import { ShieldAlert, AlertTriangle, Search, Filter, RefreshCw, Layers } from "lucide-react";
import { api } from "../../services/api/api";

export default function GISDashboard({ liveData, demoStep, isRunning, setPage, role, focusAnimal, onBackToAnimal }) {
  const [geoData, setGeoData] = useState(null);
  const [backendData, setBackendData] = useState({ farms: [], animals: [], clusters: [], cases: [], containment: [], exposureEvents: [] });
  const [loading, setLoading] = useState(true);
  
  // Extract active animal focus from prop or URL hash query
  const urlTag = new URLSearchParams(window.location.hash.split('?')[1] || '').get('animalTag') ||
                 new URLSearchParams(window.location.hash.split('?')[1] || '').get('animal');
  const activeFocusTag = focusAnimal || urlTag;
  const [focusedLocation, setFocusedLocation] = useState(null);
  
  // Layer toggles
  const [layers, setLayers] = useState({
    districtRisk: true,
    farms: true,
    animals: true,
    exposure: true,
    clusters: true,
    containment: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.gis.getMapData();
      if (res.success) {
        let { farms, animals, clusters } = res.data;
        let exposures = [];
        
        if (role && !['farmer', 'field'].includes(role)) {
          try {
            const expRes = await api.epidemiology.getExposures({ page: 1, pageSize: 1000 });
            if (expRes.success) exposures = expRes.data;
          } catch (e) {
            // Non-blocking for unprivileged roles
          }
        }
        let containmentZones = clusters
          .filter(c => c.containment && c.containment.status === 'ACTIVE')
          .map(c => c.containment);
        setBackendData({
          farms,
          animals,
          clusters,
          containment: containmentZones,
          exposureEvents: exposures,
          cases: [],
        });
      }
    } catch (err) {
      console.error("Failed to load map data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/src/assets/geo/maharashtra-districts.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Failed to load map boundaries.", err));
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [role]);

  // Derive mapData for rendering by merging backend data with simulation data
  const mapData = React.useMemo(() => {
    let { farms, animals, clusters, containment, exposureEvents, cases } = backendData;
    const isDemoActive = demoStep > 0 || isRunning;
    
    if (isDemoActive && liveData) {
      if (liveData.animals && liveData.animals.length > 0) {
        const simAnimalMap = new Map(liveData.animals.map(a => [a.id, a]));
        animals = animals.map(a => simAnimalMap.has(a.id) ? { ...a, riskLevel: simAnimalMap.get(a.id).riskEval?.riskLevel || a.riskLevel } : a);
      }
      if (liveData.clusters) clusters = liveData.clusters;
      if (liveData.exposureEvents) exposureEvents = liveData.exposureEvents;
      
      // Removed simZones logic to accurately reflect only authorized containment.
    }
    
    return { farms, animals, clusters, containment, exposureEvents, cases };
  }, [backendData, liveData, demoStep, isRunning]);

  // Resolve focused animal/farm coordinates and metadata
  useEffect(() => {
    if (!activeFocusTag) {
      setFocusedLocation(null);
      return;
    }

    const cleanTag = decodeURIComponent(activeFocusTag).trim();
    const a = mapData.animals.find(x => x.tagId === cleanTag || x.id === cleanTag);
    const f = a ? mapData.farms.find(farm => farm.id === a.farmId) : null;

    if (a && f && f.latitude != null && f.longitude != null) {
      setFocusedLocation({
        animalTag: a.tagId || a.id,
        animalId: a.id,
        farmName: f.name,
        district: f.district?.name || f.district || 'Maharashtra',
        latitude: Number(f.latitude),
        longitude: Number(f.longitude)
      });
      return;
    }

    // If not in mapData yet (e.g. initial load), fetch from backend animal endpoint (enforcing RBAC)
    api.animals.getById(cleanTag).then(res => {
      if (res.success && res.data && res.data.farm) {
        const animalData = res.data;
        const farmData = animalData.farm;
        if (farmData.latitude != null && farmData.longitude != null) {
          setFocusedLocation({
            animalTag: animalData.tagId || animalData.id,
            animalId: animalData.id,
            farmName: farmData.name,
            district: farmData.district?.name || farmData.district || (farmData.districtName || 'Maharashtra'),
            latitude: Number(farmData.latitude),
            longitude: Number(farmData.longitude)
          });
        }
      }
    }).catch(err => {
      console.warn('Could not load focused animal location:', err);
    });
  }, [activeFocusTag, mapData.animals, mapData.farms]);

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [search, setSearch] = useState("");

  const handleDistrictSelect = (name) => setSelectedDistrict(name);
  const handleFarmSelect = (farm) => setPage && setPage('farms');
  const handleAnimalSelect = (id) => setPage && setPage('animal-profile', id);

  return (
    <div className="h-full flex flex-col gap-4 bg-slate-50">
      {/* Focused Animal Banner with Back Navigation */}
      {focusedLocation && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-teal-50 border border-teal-200 rounded-xl shadow-xs text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            <span className="font-bold text-teal-950 flex items-center gap-1.5 shrink-0">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
              Selected Animal:
            </span>
            <span className="font-mono font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 shrink-0">
              {focusedLocation.animalTag}
            </span>
            <span className="text-slate-400 hidden sm:inline">·</span>
            <span className="font-bold text-slate-800 truncate">{focusedLocation.farmName}</span>
            <span className="text-slate-400 hidden sm:inline">·</span>
            <span className="font-semibold text-slate-600">{focusedLocation.district}</span>
            <span className="text-slate-500 font-mono text-[11px] hidden md:inline">
              ({focusedLocation.latitude?.toFixed(4)}° N, {focusedLocation.longitude?.toFixed(4)}° E)
            </span>
          </div>
          <button
            onClick={() => {
              if (onBackToAnimal) onBackToAnimal();
              else if (setPage) setPage('animal-profile', activeFocusTag);
            }}
            className="w-full sm:w-auto text-center shrink-0 flex items-center justify-center gap-1 font-bold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-100/60 px-3 py-1.5 min-h-[38px] rounded-lg border border-teal-300 shadow-xs transition-colors"
          >
            ← Back to Animal Profile
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="font-serif font-bold text-teal-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base truncate">
            <ShieldAlert size={18} className="shrink-0 text-teal-700" />
            <span className="truncate">MAHARASHTRA SURVEILLANCE</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Animal or Farm..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-2.5 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 min-h-[38px]"
            />
          </div>
          <button 
            onClick={loadData} 
            title="Refresh Map Data"
            className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative min-h-[400px]">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col min-h-0">
          <div className="flex-1 relative z-0 min-h-[300px]">
            <GISMap 
              geoData={geoData} 
              liveData={mapData} 
              layers={layers}
              focusTarget={focusedLocation}
              onDistrictSelect={handleDistrictSelect}
              onFarmSelect={handleFarmSelect}
              onAnimalSelect={handleAnimalSelect}
            />
          </div>
          <div className="p-2.5 sm:p-3 bg-slate-800 text-white flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-semibold overflow-x-auto whitespace-nowrap shrink-0">
            <div className="flex items-center gap-1 opacity-60 mr-2 shrink-0"><Layers size={13} /> LAYERS:</div>
            {Object.keys(layers).map(k => (
              <label key={k} className="flex items-center gap-1.5 cursor-pointer hover:text-teal-300 shrink-0 select-none">
                <input 
                  type="checkbox" 
                  checked={layers[k]} 
                  onChange={() => setLayers(l => ({...l, [k]: !l[k]}))}
                  className="accent-teal-500 rounded"
                /> 
                <span>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={`
          absolute md:relative bottom-0 left-0 right-0 z-20 
          md:z-auto md:w-[350px] flex flex-col gap-4 
          transition-transform duration-300 ease-in-out
          ${selectedDistrict ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          bg-slate-100 md:bg-transparent p-3 sm:p-4 md:p-0 rounded-t-2xl md:rounded-none shadow-2xl md:shadow-none
          max-h-[65vh] md:max-h-full overflow-y-auto max-w-full
        `}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2 md:hidden cursor-pointer" onClick={() => setSelectedDistrict(null)} />

          {selectedDistrict ? (
            (() => {
              const districtFarms = mapData.farms.filter(f => {
                const fDist = typeof f.district === 'string' ? f.district : (f.district?.name || '');
                return fDist.toLowerCase() === selectedDistrict.toLowerCase();
              });
              const farmIds = districtFarms.map(f => f.id);
              const districtAnimals = mapData.animals.filter(a => farmIds.includes(a.farmId));
              const animalIds = districtAnimals.map(a => a.id);
              const districtExposure = mapData.exposureEvents.filter(e => animalIds.includes(e.sourceId) || animalIds.includes(e.targetId));
              const districtClusters = mapData.clusters.filter(c => {
                const cDist = typeof c.district === 'string' ? c.district : (c.district?.name || '');
                return cDist === selectedDistrict;
              });
              
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
                      <div className="flex justify-between items-center text-red-700 font-bold mb-2"><span>Potential Clusters</span><span>{districtClusters.length}</span></div>
                      <div className="flex justify-between items-center text-orange-700 font-bold mb-2"><span>Potential Exposures</span><span>{districtExposure.length}</span></div>
                    </div>
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Active Containment Zones</h3>
            <div className="space-y-3">
              {mapData.containment.length > 0 ? mapData.containment.map(c => (
                <div key={c.id} className="p-3 bg-slate-800 text-white rounded-lg border border-slate-900 text-sm">
                  <div className="font-bold mb-1">Active Containment Zone</div>
                  <div className="text-xs text-slate-300">Radius: {c.radiusKm} km</div>
                </div>
              )) : (
                <div className="text-slate-500 text-sm italic">
                  No active containment zones.<br/>
                  <span className="text-xs text-slate-400 block mt-1">Containment zone creation requires authorized district or state official verification.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ); 
}