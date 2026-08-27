import React, { useState } from 'react';
import { PawPrint, Camera, Cpu, Activity, ArrowLeft } from 'lucide-react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import FingerprintChart from '../common/FingerprintChart';

export default function AnimalProfile({ liveData, animalId, setPage, role }) {
  const [tab, setTab] = useState("overview");
  const animal = liveData.animals.find(a => a.id === animalId) || liveData.animals[0];
  const breed = liveData.breeds.find(b => b.id === animal.breedId);
  const species = liveData.species.find(s => s.id === animal.speciesId);

  return (
    <div className="animate-in fade-in duration-300">
      <button onClick={() => setPage("animals")} className="mb-4 flex items-center gap-2 text-sm font-bold text-teal-700 hover:underline">
        <ArrowLeft size={16} /> Back to list
      </button>

      <SectionTitle eyebrow="Animal Profile" title={animal.id}>
        <RiskBadge level={animal.riskEval?.healthRiskLevel || "GREEN"} size="lg" />
      </SectionTitle>

      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
        {["overview", "fingerprint", "observations", "risk", "exposure", "cases"].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 ${tab === t ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card className="p-4 bg-white">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Identification</div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between"><span className="text-slate-500">Species</span> <span className="font-medium">{species?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Breed</span> <span className="font-medium">{breed?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Age</span> <span className="font-medium">{animal.age} years</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sex</span> <span className="font-medium">{animal.sex}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Farm ID</span> <span className="font-medium">{animal.farmId}</span></div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          {tab === "overview" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Current Health Status</h3>
              <p className="text-sm text-slate-600 mb-4">
                {animal.riskEval?.reasons.length > 0 
                  ? animal.riskEval.reasons.map((r, i) => <div key={i} className="mb-1 text-red-700">• {r.text}</div>)
                  : "No abnormal deviations detected. Normal routine monitoring."}
              </p>
              
              <h4 className="font-bold text-sm text-slate-900 mt-6 mb-2">Recommended Action</h4>
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-700 font-medium">
                {animal.riskEval?.recommendedAction || "Continue routine monitoring."}
              </div>
            </Card>
          )}

          {tab === "fingerprint" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Health Fingerprint</h3>
              <FingerprintChart animal={animal} />
            </Card>
          )}

          {tab === "observations" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Clinical Observations</h3>
              <div className="text-sm text-slate-500 italic">No field observations recorded today.</div>
            </Card>
          )}

          {tab === "risk" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">AI Risk Assessment (Knowledge Base)</h3>
              {animal.riskEval?.diseaseRisks.length > 0 ? (
                <div className="space-y-3">
                  {animal.riskEval.diseaseRisks.map((dr, i) => (
                    <div key={i} className="p-3 border border-slate-200 rounded-lg">
                      <div className="font-bold text-teal-800">{dr.disease.name}</div>
                      <div className="text-xs text-slate-500 mt-1">Pathogen: {dr.disease.pathogen} | Category: {dr.disease.category}</div>
                      <div className="text-xs font-semibold text-slate-700 mt-2">Evidence: {dr.evidence}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No elevated disease risks identified based on current parameters.</div>
              )}
            </Card>
          )}
          
          {(tab === "exposure" || tab === "cases") && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 capitalize">{tab} Workflow</h3>
              <div className="text-sm text-slate-500">Detailed workflow view is accessible in the main dashboard panels.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
