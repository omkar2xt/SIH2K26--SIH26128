import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Quick icon fix for leaflet in react
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MaharashtraMap({ liveData }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/src/assets/geo/maharashtra-districts.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Error loading geojson", err));
  }, []);

  // Use liveData to get the district risk instead of static DEMO_DB
  const getStyle = (feature) => {
    const name = feature.properties.dtname || feature.properties.district || feature.properties.DISTRICT || "";
    const districtData = liveData.districts.find(d => name.toLowerCase().includes(d.id.toLowerCase()));
    
    let color = "#3388ff"; // default blue
    if (districtData) {
      if (districtData.risk === "RED" || districtData.risk === "CRITICAL") color = "#dc2626";
      else if (districtData.risk === "ORANGE") color = "#ea580c";
      else if (districtData.risk === "YELLOW") color = "#d97706";
      else if (districtData.risk === "GREEN") color = "#059669";
    }

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      const name = feature.properties.dtname || feature.properties.district || feature.properties.DISTRICT || "Unknown District";
      layer.bindPopup(`<b>${name}</b>`);
    }
  };

  return (
    <div className="h-full w-full relative">
      {/* Add a key to MapContainer if you want it to completely re-render, 
          but usually we just rely on GeoJSON updating. 
          To ensure GeoJSON updates when styles change, we must give it a unique key based on liveData 
          if the library doesn't automatically diff styles well. */}
      <MapContainer center={[19.7515, 75.7139]} zoom={6} className="h-full w-full z-0">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {geoData && (
          <GeoJSON 
            key={JSON.stringify(liveData.districts.map(d => d.risk))} // Force re-render of GeoJSON when risks change
            data={geoData} 
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Farm Markers */}
        {liveData.farms.map((farm) => (
          <Marker key={farm.id} position={[farm.lat, farm.lng]}>
            <Popup>
              <div className="font-sans">
                <div className="font-bold text-sm text-slate-900">{farm.name}</div>
                <div className="text-xs text-slate-500">{farm.village}, {farm.district}</div>
                <div className="mt-2 text-xs font-semibold text-slate-700">Animals: {farm.animals}</div>
                <div className="text-xs font-bold mt-1">
                  Risk Level: <span className={
                    farm.risk === 'RED' ? 'text-red-600' :
                    farm.risk === 'ORANGE' ? 'text-orange-600' :
                    farm.risk === 'YELLOW' ? 'text-amber-600' : 'text-emerald-600'
                  }>{farm.risk}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Animal Markers (High Risk) */}
        {liveData.animals.filter(a => a.riskEval?.riskLevel === "RED" || a.riskEval?.riskLevel === "CRITICAL").map((animal) => (
          <CircleMarker 
            key={animal.id} 
            center={[animal.lat, animal.lng]} 
            radius={8} 
            pathOptions={{ color: '#991b1b', fillColor: '#ef4444', fillOpacity: 0.8 }}
          >
            <Popup>
              <div className="font-bold text-sm text-red-700">{animal.id} ({animal.species})</div>
              <div className="text-xs text-slate-600 font-bold mb-1">Risk: {animal.riskEval.riskLevel}</div>
              <div className="text-xs text-slate-600">
                Activity: {animal.current.activity} (Base: {animal.baseline.activity})
              </div>
              <div className="text-xs text-slate-600">
                Feeding: {animal.current.feeding} (Base: {animal.baseline.feeding})
              </div>
            </Popup>
          </CircleMarker>
        ))}

      </MapContainer>
      
      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-slate-200 z-[1000] text-sm pointer-events-auto">
        <div className="font-bold text-slate-800 mb-2 border-b pb-1">Risk Legend</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#dc2626]"></span> Veterinary Alert (Red)</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ea580c]"></span> Field Verification (Orange)</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#d97706]"></span> Monitor (Yellow)</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#059669]"></span> Normal (Green)</div>
        </div>
      </div>
    </div>
  );
}