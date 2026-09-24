import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

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
  layers, 
  onDistrictSelect,
  onFarmSelect,
  onAnimalSelect
}) {
  const [map, setMap] = useState(null);

  const getDistrictRiskColor = (districtName) => {
    const farmsInDistrict = liveData.farms.filter(f => f.district && f.district.name.toLowerCase() === districtName.toLowerCase());
    const animalIds = liveData.animals.filter(a => farmsInDistrict.some(f => f.id === a.farmId)).map(a => a.id);
    const critical = liveData.animals.some(a => animalIds.includes(a.id) && (a.riskLevel === "CRITICAL" || a.riskLevel === "RED"));
    const orange = liveData.animals.some(a => animalIds.includes(a.id) && a.riskLevel === "ORANGE");
    
    const hasCluster = liveData.clusters?.some(c => c.district && c.district.name.toLowerCase() === districtName.toLowerCase());
    
    // Check containment via clusters
    const hasContainment = liveData.clusters?.some(c => c.district && c.district.name.toLowerCase() === districtName.toLowerCase() && c.containment && c.containment.status === 'ACTIVE');

    if (hasContainment) return '#7f1d1d'; // DARK RED
    if (critical || hasCluster) return '#dc2626'; // RED
    if (orange) return '#ea580c'; // ORANGE
    return '#10b981'; // GREEN default
  };

  const geoJsonStyle = (feature) => {
    const districtName = feature.properties.NAME_2 || feature.properties.dtname || feature.properties.NAME_1; 
    let fillColor = '#10b981'; 
    if (layers.districtRisk) {
      fillColor = getDistrictRiskColor(districtName || feature.properties.name);
    }
    return { fillColor, weight: 1, opacity: 1, color: '#ffffff', fillOpacity: 0.6 };
  };

  const onEachFeature = (feature, layer) => {
    const districtName = feature.properties.NAME_2 || feature.properties.dtname || feature.properties.NAME_1 || feature.properties.name;
    layer.bindTooltip(`<strong>${districtName}</strong><br/>Click to view details`, { sticky: true });
    layer.on({
      click: (e) => {
        if (map) map.fitBounds(e.target.getBounds());
        onDistrictSelect(districtName);
      },
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.8, weight: 2 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.6, weight: 1 })
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
          center={[19.7515, 75.7139]} 
          zoom={6} 
          className="h-full w-full z-0"
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON data={geoData} style={geoJsonStyle} onEachFeature={onEachFeature} />
          
          {layers.farms && liveData.farms.map(farm => {
            if (!farm.latitude || !farm.longitude) return null;
            return (
            <Marker key={farm.id} position={[farm.latitude, farm.longitude]} icon={farmIcon} eventHandlers={{ click: () => onFarmSelect(farm) }}>
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-teal-800">{farm.code}</div>
                  <div className="text-xs text-slate-500 mb-2">{farm.district?.name}</div>
                  <button onClick={() => onFarmSelect(farm)} className="block w-full py-1 mt-1 bg-slate-100 text-slate-700 font-bold rounded text-xs">View Farm</button>
                </div>
              </Popup>
            </Marker>
            );
          })}

          {layers.animals && liveData.animals.filter(a => a.riskLevel === "RED" || a.riskLevel === "CRITICAL").map(animal => {
            const farm = liveData.farms.find(f => f.id === animal.farmId);
            if (!farm || !farm.latitude || !farm.longitude) return null;
            return (
              <Marker key={animal.id} position={[farm.latitude + 0.01, farm.longitude + 0.01]} icon={highRiskIcon}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-red-700">{animal.tagId}</div>
                    <div className="text-xs text-slate-500">Risk: {animal.riskLevel}</div>
                    <button onClick={() => onAnimalSelect(animal.id)} className="block w-full py-1 mt-2 bg-slate-100 text-slate-700 font-bold rounded text-xs">Open Profile</button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {layers.exposure && liveData.exposureEvents?.map((event, i) => {
            const sourceFarm = liveData.farms.find(f => f.id === event.source?.farmId);
            const targetFarm = liveData.farms.find(f => f.id === event.target?.farmId);
            if (!sourceFarm || !targetFarm || !sourceFarm.latitude || !targetFarm.latitude) return null;
            const color = event.riskLevel === "HIGH" ? "red" : event.riskLevel === "MEDIUM" ? "orange" : "gray";
            return (
              <Polyline key={i} positions={[[sourceFarm.latitude, sourceFarm.longitude], [targetFarm.latitude, targetFarm.longitude]]} color={color} dashArray="5, 10" weight={3}>
                <Popup>
                  <div className="text-sm font-bold text-slate-800">Potential Exposure</div>
                  <div className="text-xs text-slate-500">Risk: {event.riskLevel}</div>
                </Popup>
              </Polyline>
            );
          })}
          
          {layers.containment && liveData.containment?.map((c, i) => {
            if (!c.centerLat || !c.centerLng) return null;
            return (
              <CircleMarker key={i} center={[c.centerLat, c.centerLng]} radius={c.radiusKm * 10} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}>
                <Popup>
                  <div className="text-sm font-bold text-red-900">Active Containment Zone</div>
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
