import React from 'react';
import { PawPrint, ClipboardList, Layers, Syringe, ShieldAlert, FlaskConical, AlertTriangle, Network } from 'lucide-react';
import { SectionTitle, StatCard, Card, RiskBadge } from '../common/UIComponents';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export default function OfficialDashboard({ liveData, setPage }) {
  // --- DERIVED METRICS ---
  const totalAnimals = liveData.animals.length;
  const activeCases = liveData.cases.filter(c => c.stage !== "Closed").length;
  const potentialClusters = liveData.clusters?.length || 0;
  const coveragePercent = 78; // In a real app this would calculate from liveData.vaccinations
  const highRiskAnimals = liveData.animals.filter(a => a.riskEval?.healthRiskLevel === "RED" || a.riskEval?.healthRiskLevel === "CRITICAL").length;
  const potentialExposures = liveData.exposureEvents?.length || 0;
  
  const pendingLabs = liveData.labSamples.filter(s => s.result === "Pending").length;
  const activeContainment = liveData.containment?.filter(c => c.status === "ACTIVE").length || 0;
  const criticalAlerts = liveData.alerts.filter(a => a.severity === "CRITICAL" && a.status === "OPEN").length;
  
  // High Risk Districts (derive from animal risks and clusters)
  const districtsMap = {};
  liveData.farms.forEach(f => {
    if (!districtsMap[f.district]) districtsMap[f.district] = { farms: 0, animals: 0, highRisk: 0, alerts: 0, clusters: 0, exposures: 0, risk: "GREEN" };
    districtsMap[f.district].farms += 1;
  });
  liveData.animals.forEach(a => {
    const farm = liveData.farms.find(f => f.id === a.farmId);
    if (farm) {
      const d = districtsMap[farm.district];
      d.animals += 1;
      if (a.riskEval?.healthRiskLevel === "RED" || a.riskEval?.healthRiskLevel === "CRITICAL") d.highRisk += 1;
      const hasAlert = liveData.alerts.some(al => al.animalId === a.id && al.status === "OPEN");
      if (hasAlert) d.alerts += 1;
      
      const hasExposure = liveData.exposureEvents?.some(e => e.sourceId === a.id || e.targetId === a.id);
      if (hasExposure) d.exposures += 1;
    }
  });
  
  liveData.clusters?.forEach(c => {
    if (districtsMap[c.district]) districtsMap[c.district].clusters += 1;
  });
  
  // Calculate risk level for each district
  Object.keys(districtsMap).forEach(dName => {
    const d = districtsMap[dName];
    if (d.highRisk > 0 || d.clusters > 0) d.risk = "RED";
    else if (d.alerts > 0 || d.exposures > 0) d.risk = "ORANGE";
  });
  
  const highRiskDistricts = Object.values(districtsMap).filter(d => d.risk === "RED" || d.risk === "CRITICAL").length;

  // Disease Distribution Chart (Demo data generated from rules engine results)
  const diseaseCounts = {};
  liveData.animals.forEach(a => {
    a.riskEval?.diseaseRisks?.forEach(dr => {
      diseaseCounts[dr.disease.name] = (diseaseCounts[dr.disease.name] || 0) + 1;
    });
  });
  const diseaseChartData = Object.keys(diseaseCounts).map(name => ({
    disease: name.substring(0, 15) + (name.length > 15 ? '...' : ''),
    cases: diseaseCounts[name]
  }));
  if (diseaseChartData.length === 0) diseaseChartData.push({ disease: "No active risks", cases: 0 });

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <SectionTitle eyebrow="District & State Decision Support" title="Maharashtra Livestock Health Surveillance">
        <div className="flex gap-2">
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Districts</option><option>Nashik</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Diseases</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>All Species</option></select>
          <select className="text-sm border border-slate-200 rounded p-1.5"><option>Last 30 Days</option></select>
        </div>
      </SectionTitle>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Animals Tracked" value={totalAnimals} icon={PawPrint} tone="teal" />
        <StatCard label="Active Veterinary Cases" value={activeCases} icon={ClipboardList} tone="teal" />
        <StatCard label="High-Risk Animals" value={highRiskAnimals} icon={ShieldAlert} tone="red" />
        <StatCard label="Potential Exposures" value={potentialExposures} icon={Network} tone="orange" />
        <StatCard label="Potential Clusters" value={potentialClusters} icon={Layers} tone="red" />
        <StatCard label="Lab Pending" value={pendingLabs} icon={FlaskConical} tone="orange" />
        <StatCard label="Vaccination Coverage" value={`${coveragePercent}%`} icon={Syringe} tone="emerald" />
        <StatCard label="Active Containment Zones" value={activeContainment} icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Situation & Operational Queue */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Current Situation</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span className="text-slate-600">Active Alerts</span><span className="font-bold">{liveData.alerts.length}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-600">New Alerts Today</span><span className="font-bold">{liveData.alerts.length}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-600">Critical Cases</span><span className="font-bold">{criticalAlerts}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-600">High-Risk Districts</span><span className="font-bold text-red-600">{highRiskDistricts}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-600">Exposure Cases</span><span className="font-bold text-orange-600">{potentialExposures}</span></div>
            </div>
          </Card>
          
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Operational Queue</h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-800">Critical Alerts</div>
                  <div className="text-[10px] text-red-600">Require immediate assignment</div>
                </div>
                <div className="text-xl font-bold text-red-700">{criticalAlerts}</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-800">Pending Lab Results</div>
                  <div className="text-[10px] text-amber-600">Samples submitted, awaiting data</div>
                </div>
                <div className="text-xl font-bold text-amber-700">{pendingLabs}</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-800">Field Review Cases</div>
                  <div className="text-[10px] text-blue-600">Veterinary verification required</div>
                </div>
                <div className="text-xl font-bold text-blue-700">{liveData.cases.filter(c => c.stage === "Field Review").length}</div>
              </div>
              <div className="p-3 bg-slate-800 border border-slate-900 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Containment Tasks</div>
                  <div className="text-[10px] text-slate-300">Active monitoring zones</div>
                </div>
                <div className="text-xl font-bold text-white">{activeContainment}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* District Risk & Disease Distribution */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-0 overflow-x-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center min-w-[600px]">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">District Risk Overview</h3>
              <button onClick={() => setPage("gis")} className="text-xs bg-teal-800 text-white px-3 py-1 rounded font-bold hover:bg-teal-700">View Map</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3 text-right">Animals</th>
                  <th className="px-4 py-3 text-right">Farms</th>
                  <th className="px-4 py-3 text-right">Alerts</th>
                  <th className="px-4 py-3 text-right">High-Risk</th>
                  <th className="px-4 py-3 text-right">Clusters</th>
                  <th className="px-4 py-3 text-right">Exposure</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(districtsMap).length > 0 ? Object.keys(districtsMap).map(dName => {
                  const d = districtsMap[dName];
                  return (
                    <tr key={dName} className="hover:bg-slate-50 cursor-pointer" onClick={() => setPage("gis")}>
                      <td className="px-4 py-3 font-bold text-slate-800">{dName}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{d.animals}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{d.farms}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{d.alerts}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-bold">{d.highRisk}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{d.clusters}</td>
                      <td className="px-4 py-3 text-right text-orange-600 font-bold">{d.exposures}</td>
                      <td className="px-4 py-3"><RiskBadge level={d.risk} /></td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan="8" className="p-8 text-center text-slate-500">No district data available.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
          
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wide">Disease Distribution <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2 normal-case">DEMO DATA</span></h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={diseaseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="disease" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cases" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}