import React, { useState, useEffect } from "react";
import GISMap from "./GISMap";
import { ShieldAlert, AlertTriangle, Search, Filter, RefreshCw, Layers } from "lucide-react";
import { api } from "../../services/api/api";

export default function GISDashboard({ setPage }) { 
  const [geoData, setGeoData] = useState(null);
  const [mapData, setMapData] = useState({ farms: [], animals: [], clusters: [], cases: [], containment: [], exposureEvents: [] });
  const [loading, setLoading] = useState(true);
  
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
        const { farms, animals, clusters } = res.data;
        // Also fetch exposures
        const expRes = await api.epidemiology.getExposures({ page: 1, pageSize: 1000 });
        const exposures = expRes.success ? expRes.data : [];
        
        // Extract containment zones from clusters
        const containmentZones = clusters
          .filter(c => c.containment && c.containment.status === 'ACTIVE')
          .map(c => c.containment);

        setMapData({
          farms,
          animals,
          clusters,
          containment: containmentZones,
          exposureEvents: exposures,
          cases: [], // cases are handled separately in 2H, we leave empty for GIS map
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

    loadData();
    const interval = setInterval(loadData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [search, setSearch] = useState("");

  const handleDistrictSelect = (name) => setSelectedDistrict(name);
  const handleFarmSelect = (farm) => setPage && setPage('farms');
  const handleAnimalSelect = (id) => setPage && setPage('animal-profile', id);

  return (
    <div className="h-full flex flex-col gap-4 bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="font-serif font-bold text-teal-900 flex items-center gap-2">
            <ShieldAlert size={20} />
            MAHARASHTRA SURVEILLANCE (AUTHORITATIVE)
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
          <button onClick={loadData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
          <div className="flex-1 relative z-0">
            <GISMap 
              geoData={geoData} 
              liveData={mapData} 
              layers={layers}
              onDistrictSelect={handleDistrictSelect}
              onFarmSelect={handleFarmSelect}
              onAnimalSelect={handleAnimalSelect}
            />
          </div>
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

        <div className={`
          absolute md:relative bottom-0 left-0 right-0 z-10 
          md:z-auto md:w-[350px] flex flex-col gap-4 
          transition-transform duration-300 ease-in-out
          ${selectedDistrict ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          bg-slate-100 md:bg-transparent p-4 md:p-0 rounded-t-2xl md:rounded-none shadow-2xl md:shadow-none
          max-h-[60vh] md:max-h-full overflow-y-auto
        `}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2 md:hidden" onClick={() => setSelectedDistrict(null)} />

          {selectedDistrict ? (
            (() => {
              const districtFarms = mapData.farms.filter(f => f.district && f.district.name === selectedDistrict);
              const farmIds = districtFarms.map(f => f.id);
              const districtAnimals = mapData.animals.filter(a => farmIds.includes(a.farmId));
              const animalIds = districtAnimals.map(a => a.id);
              const districtExposure = mapData.exposureEvents.filter(e => animalIds.includes(e.sourceId) || animalIds.includes(e.targetId));
              const districtClusters = mapData.clusters.filter(c => c.district && c.district.name === selectedDistrict);
              
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
                <div className="text-slate-500 text-sm italic">No active containment zones.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ); 
}