import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in Vite
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

// Custom Icons for different entities
const farmIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const highRiskIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function GISMap({ 
  liveData, 
  geoData, 
  filters, 
  layers, 
  onDistrictSelect,
  onFarmSelect,
  onAnimalSelect,
  onClusterSelect
}) {
  const [map, setMap] = useState(null);

  // Helper to calculate district risk from live data (combining animals, alerts, clusters)
  const getDistrictRiskColor = (districtName) => {
    // Determine risk based on liveData and active filters
    const farmsInDistrict = liveData.farms.filter(f => f.district.toLowerCase() === districtName.toLowerCase());
    const animalIds = liveData.animals.filter(a => farmsInDistrict.some(f => f.id === a.farmId)).map(a => a.id);
    const critical = liveData.animals.some(a => animalIds.includes(a.id) && (a.riskEval?.healthRiskLevel === "CRITICAL" || a.riskEval?.healthRiskLevel === "RED"));
    const orange = liveData.animals.some(a => animalIds.includes(a.id) && a.riskEval?.healthRiskLevel === "ORANGE");
    
    // Check clusters
    const hasCluster = liveData.clusters?.some(c => c.district.toLowerCase() === districtName.toLowerCase());
    
    // Check containment
    const hasContainment = liveData.containment?.some(c => c.zone.toLowerCase().includes(districtName.toLowerCase()));

    if (hasContainment) return '#7f1d1d'; // DARK RED
    if (critical || hasCluster) return '#dc2626'; // RED
    if (orange) return '#ea580c'; // ORANGE
    return '#10b981'; // GREEN default
  };

  const geoJsonStyle = (feature) => {
    const districtName = feature.properties.NAME_2 || feature.properties.dtname || feature.properties.NAME_1; 
    // ^ Handle variations in geojson property names
    
    let fillColor = '#10b981'; // Default green
    
    if (layers.districtRisk) {
      fillColor = getDistrictRiskColor(districtName || feature.properties.name);
    }

    return {
      fillColor,
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature, layer) => {
    const districtName = feature.properties.NAME_2 || feature.properties.dtname || feature.properties.NAME_1 || feature.properties.name;
    
    // Tooltip on hover
    layer.bindTooltip(`<strong>${districtName}</strong><br/>Click to view details`, { sticky: true });
    
    layer.on({
      click: (e) => {
        if (map) map.fitBounds(e.target.getBounds());
        onDistrictSelect(districtName);
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({ fillOpacity: 0.8, weight: 2 });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({ fillOpacity: 0.6, weight: 1 });
      }
    });
  };

  return (
    <div className="h-full w-full relative bg-slate-100">
      {!geoData ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold z-10">
          Loading map boundary data...
        </div>
      ) : (
        <MapContainer 
          center={[19.7515, 75.7139]} // Maharashtra Center
          zoom={6} 
          className="h-full w-full z-0"
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <GeoJSON 
            data={geoData} 
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
          
          {/* FARMS LAYER */}
          {layers.farms && liveData.farms.map(farm => (
            <Marker 
              key={farm.id} 
              position={[farm.lat, farm.lng]} 
              icon={farmIcon}
              eventHandlers={{ click: () => onFarmSelect(farm) }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-teal-800">{farm.name}</div>
                  <div className="text-xs text-slate-500 mb-2">{farm.district} • {farm.village || "Unknown Village"}</div>
                  <div className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1 rounded inline-block mb-2">DEMO DATA</div>
                  <button onClick={() => onFarmSelect(farm)} className="block w-full py-1 mt-1 bg-slate-100 text-slate-700 font-bold rounded text-xs hover:bg-slate-200">View Farm</button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* HIGH RISK ANIMALS LAYER */}
          {layers.animals && liveData.animals.filter(a => a.riskEval?.healthRiskLevel === "RED" || a.riskEval?.healthRiskLevel === "CRITICAL").map(animal => {
            const farm = liveData.farms.find(f => f.id === animal.farmId);
            if (!farm) return null;
            // Add a tiny offset so it doesn't perfectly overlap the farm marker
            return (
              <Marker 
                key={animal.id} 
                position={[farm.lat + 0.01, farm.lng + 0.01]} 
                icon={highRiskIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-red-700">{animal.id}</div>
                    <div className="text-xs text-slate-500">{animal.speciesId} • Risk: {animal.riskEval.healthRiskLevel}</div>
                    <div className="text-xs italic text-slate-600 my-1">{animal.riskEval.healthAbnormality} abnormality</div>
                    <button onClick={() => onAnimalSelect(animal.id)} className="block w-full py-1 mt-2 bg-slate-100 text-slate-700 font-bold rounded text-xs hover:bg-slate-200">Open Profile</button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* EXPOSURE NETWORK LAYER */}
          {layers.exposure && liveData.exposureEvents?.map((event, i) => {
            const sourceFarm = liveData.farms.find(f => f.id === liveData.animals.find(a => a.id === event.sourceId)?.farmId);
            const targetFarm = liveData.farms.find(f => f.id === liveData.animals.find(a => a.id === event.targetId)?.farmId);
            if (!sourceFarm || !targetFarm) return null;
            
            const color = event.risk === "HIGH" ? "red" : event.risk === "MEDIUM" ? "orange" : "gray";
            return (
              <Polyline 
                key={i} 
                positions={[[sourceFarm.lat, sourceFarm.lng], [targetFarm.lat, targetFarm.lng]]} 
                color={color} 
                dashArray="5, 10" 
                weight={3}
              >
                <Popup>
                  <div className="text-sm font-bold text-slate-800">Potential Exposure</div>
                  <div className="text-xs text-slate-500">Source: {event.sourceId}</div>
                  <div className="text-xs text-slate-500">Target: {event.targetId}</div>
                  <div className="text-xs font-semibold text-orange-700 mt-1">Risk: {event.risk}</div>
                </Popup>
              </Polyline>
            );
          })}
          
          {/* CONTAINMENT LAYER */}
          {layers.containment && liveData.containment?.map((c, i) => {
            // Find a farm in the district to center the circle
            const farm = liveData.farms.find(f => c.zone.toLowerCase().includes(f.district.toLowerCase()));
            if (!farm) return null;
            return (
              <CircleMarker 
                key={i} 
                center={[farm.lat, farm.lng]} 
                radius={40} 
                pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
              >
                <Popup>
                  <div className="text-sm font-bold text-red-900">Containment Workflow</div>
                  <div className="text-xs text-slate-600">{c.zone}</div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">Reason: {c.reason}</div>
                  <div className="text-xs text-slate-500 mt-1">Status: {c.status}</div>
                </Popup>
              </CircleMarker>
            );
          })}

        </MapContainer>
      )}
    </div>
  );
}
