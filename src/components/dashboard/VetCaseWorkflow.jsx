import React, { useState } from 'react';
import { SectionTitle, Card } from '../common/UIComponents';
import { ChevronRight } from 'lucide-react';

const CASE_STAGES = ["New Alert", "Accepted", "Field Review", "Sample Collected", "Lab Submitted", "Lab Result", "Confirmed / Rejected", "Action", "Follow-up", "Closed"];

export default function VetCaseWorkflow({ liveData, updateCaseStage }) {
  const [selectedCase, setSelectedCase] = useState(null);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle title="Veterinary Case Workflow" />
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-0 border-r md:col-span-1 h-[600px] overflow-y-auto">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">Active Cases</div>
          {liveData.cases.map(c => (
            <button 
              key={c.id} 
              onClick={() => setSelectedCase(c)}
              className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 flex items-center justify-between ${selectedCase?.id === c.id ? "bg-teal-50 border-l-4 border-l-teal-600" : ""}`}
            >
              <div>
                <div className="font-bold text-teal-900">{c.id}</div>
                <div className="text-xs text-slate-500">Animal: {c.animalId}</div>
                <div className="text-xs font-semibold text-amber-600 mt-1">{c.stage}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          ))}
          {liveData.cases.length === 0 && <div className="p-4 text-sm text-slate-500 text-center">No active cases.</div>}
        </Card>

        <Card className="p-6 md:col-span-2">
          {selectedCase ? (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Case: {selectedCase.id}</h3>
              <p className="text-sm text-slate-600 mb-6">Animal ID: {selectedCase.animalId} | Suspected: {selectedCase.suspectedDisease}</p>
              
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-800">Update Stage</div>
                <div className="flex flex-wrap gap-2">
                  {CASE_STAGES.map(stage => (
                    <button 
                      key={stage}
                      onClick={() => {
                        updateCaseStage(selectedCase.id, stage);
                        setSelectedCase({ ...selectedCase, stage });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedCase.stage === stage ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700"}`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="text-sm font-bold text-slate-800">Case Notes</div>
                <textarea 
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  rows="4"
                  defaultValue={selectedCase.notes}
                  placeholder="Enter clinical notes..."
                ></textarea>
                <button className="px-4 py-2 bg-teal-800 text-white text-sm font-bold rounded-lg hover:bg-teal-700">Save Notes</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Select a case from the list to view details and update workflow.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
