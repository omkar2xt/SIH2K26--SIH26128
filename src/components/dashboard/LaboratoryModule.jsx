import React, { useState } from 'react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import { FlaskConical, Plus } from 'lucide-react';

export default function LaboratoryModule({ liveData, addLabSample, updateLabResult }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle title="Laboratory Workflow">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">
          <Plus size={16} /> Submit Sample
        </button>
      </SectionTitle>

      {showAdd && (
        <Card className="p-6 mb-6 bg-teal-50/50 border-teal-100">
          <h3 className="text-sm font-bold text-teal-900 mb-4">Submit New Sample</h3>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              addLabSample({
                caseId: formData.get("caseId"),
                animalId: formData.get("animalId"),
                type: formData.get("type"),
                test: formData.get("test"),
                date: new Date().toISOString().split('T')[0],
                result: "Pending"
              });
              setShowAdd(false);
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <input required name="caseId" type="text" placeholder="Case ID" className="p-2 text-sm border border-slate-200 rounded" />
              <input required name="animalId" type="text" placeholder="Animal ID" className="p-2 text-sm border border-slate-200 rounded" />
              <select name="type" className="p-2 text-sm border border-slate-200 rounded">
                <option value="Blood / Serum">Blood / Serum</option>
                <option value="Nasal Swab">Nasal Swab</option>
                <option value="Tissue">Tissue</option>
              </select>
              <select name="test" className="p-2 text-sm border border-slate-200 rounded">
                <option value="ELISA">ELISA</option>
                <option value="RT-PCR">RT-PCR</option>
                <option value="Microscopy">Microscopy</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit"
                className="px-4 py-2 bg-teal-700 text-white font-bold text-sm rounded hover:bg-teal-800"
              >
                Submit to Lab
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-sm rounded hover:bg-slate-300">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Sample ID</th>
              <th className="px-4 py-3">Case ID</th>
              <th className="px-4 py-3">Animal</th>
              <th className="px-4 py-3">Type & Test</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status / Result</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {liveData.labSamples.length > 0 ? liveData.labSamples.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-700">{s.id}</td>
                <td className="px-4 py-3 text-slate-600">{s.caseId}</td>
                <td className="px-4 py-3 text-slate-600">{s.animalId}</td>
                <td className="px-4 py-3 text-slate-600">{s.type} - {s.test}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{s.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${s.result === 'Pending' ? 'bg-amber-100 text-amber-800' : s.result === 'Positive' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {s.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <select 
                    value={s.result}
                    onChange={(e) => updateLabResult(s.id, e.target.value)}
                    className="text-xs p-1 border border-slate-200 rounded"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                    <option value="Inconclusive">Inconclusive</option>
                  </select>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500">No lab samples recorded.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
