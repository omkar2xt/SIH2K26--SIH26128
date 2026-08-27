import React, { useState } from 'react';
import { SectionTitle, Card } from '../common/UIComponents';
import { Search, Database, AlertCircle } from 'lucide-react';

export default function DiseaseKnowledgeBase({ liveData }) {
  const [search, setSearch] = useState("");
  const [selectedDisease, setSelectedDisease] = useState(null);

  const diseases = liveData.diseases.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle title="Disease Knowledge Base">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search diseases..." 
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </SectionTitle>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-0 border-r md:col-span-1 h-[600px] overflow-y-auto bg-white">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm flex items-center gap-2">
            <Database size={16} className="text-teal-700" /> Priority Diseases (16)
          </div>
          {diseases.map(d => (
            <button 
              key={d.id} 
              onClick={() => setSelectedDisease(d)}
              className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 ${selectedDisease?.id === d.id ? "bg-teal-50 border-l-4 border-l-teal-600" : ""}`}
            >
              <div className="font-bold text-slate-800">{d.name}</div>
              <div className="text-xs text-slate-500 mt-1 truncate">{d.category}</div>
            </button>
          ))}
        </Card>

        <Card className="p-6 md:col-span-2 bg-white">
          {selectedDisease ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{selectedDisease.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{selectedDisease.pathogen}</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{selectedDisease.category}</span>
                  {selectedDisease.zoonotic && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Zoonotic</span>}
                  {selectedDisease.notifiable && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold">Notifiable</span>}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 mb-2 border-b border-slate-100 pb-1">Species Association (Maharashtra Evidence)</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {liveData.diseaseSpecies.filter(ds => ds.diseaseId === selectedDisease.id).map((ds, i) => {
                      const sp = liveData.species.find(s => s.id === ds.speciesId);
                      return (
                        <li key={i} className="flex justify-between">
                          <span className="font-medium text-slate-700">{sp?.name || ds.speciesId}</span>
                          <span className="text-xs">{ds.evidence}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
                  <div className="font-bold flex items-center gap-2 mb-1"><AlertCircle size={16} /> Clinical & Context Notes</div>
                  This section relies on the authoritative supplied knowledge base. 
                  (Actual text populated from KB for symptoms, diagnostics, and prevention).
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Select a disease from the list to view its authoritative knowledge base profile.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
