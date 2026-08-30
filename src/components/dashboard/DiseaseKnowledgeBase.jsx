import React, { useState, useMemo } from 'react';
import { Database, Search, ChevronDown, ChevronUp, AlertTriangle, Shield, Stethoscope, Camera, Cpu } from 'lucide-react';
import { Card, SectionTitle } from '../common/UIComponents';

const EV_STYLE = {
  'Confirmed':                       'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Confirmed in supplied evidence set': 'bg-teal-100 text-teal-800 border-teal-200',
  'India-relevant; Maharashtra-specific animal-level evidence not established': 'bg-amber-100 text-amber-800 border-amber-200',
  'India-relevant; Maharashtra-specific evidence not established': 'bg-amber-100 text-amber-800 border-amber-200',
  'Not established in consulted source.': 'bg-slate-100 text-slate-500 border-slate-200',
  'Not established in consulted source': 'bg-slate-100 text-slate-500 border-slate-200',
};

function FieldRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <div className="text-xs font-semibold text-slate-500 col-span-1">{label}</div>
      <div className="text-xs text-slate-800 col-span-2">{value}</div>
    </div>
  );
}

function EvidenceBadge({ text }) {
  const style = EV_STYLE[text?.trim()] || 'bg-slate-100 text-slate-500 border-slate-200';
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${style}`}>{text}</span>;
}

export default function DiseaseKnowledgeBase({ liveData }) {
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState(null);
  const [filterSpec, setFilterSpec] = useState('');

  const diseases = liveData.diseases || [];
  const speciesList = liveData.species || [];
  const assocs = liveData.diseaseSpecies || [];

  const filtered = useMemo(() => {
    let list = diseases;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) || d.shortName?.toLowerCase().includes(q) ||
        d.pathogen?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q)
      );
    }
    if (filterSpec) {
      const specAssocDiseases = assocs.filter(a => a.speciesId === filterSpec).map(a => a.diseaseId);
      list = list.filter(d => specAssocDiseases.includes(d.id));
    }
    return list;
  }, [diseases, search, filterSpec, assocs]);

  function getAssocs(diseaseId) {
    return assocs.filter(a => a.diseaseId === diseaseId).map(a => {
      const species = speciesList.find(s => s.id === a.speciesId);
      return { ...a, species };
    });
  }

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Maharashtra Livestock Knowledge Base — FINAL v1.0" title="Disease Knowledge Base">
        <div className="text-xs text-slate-500 text-right">
          <div>16 Diseases · 33 Associations · 16 Species</div>
          <div className="font-bold text-teal-700 mt-0.5">Source: MH_Livestock_Knowledge_Base_FINAL_v1.md</div>
        </div>
      </SectionTitle>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800 font-semibold">
        ⚠ This knowledge base is a risk-triage reference only. AI/rule-engine outputs do not constitute veterinary diagnosis. Laboratory confirmation is required.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="pl-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none" placeholder="Search by disease name, pathogen, category…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={filterSpec} onChange={e => setFilterSpec(e.target.value)}>
          <option value="">All Species</option>
          {speciesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="text-xs text-slate-500">Showing {filtered.length} of {diseases.length} diseases</div>

      {/* Disease cards */}
      <div className="space-y-2">
        {filtered.map(d => {
          const disAssocs = getAssocs(d.id);
          const isOpen    = expanded === d.id;
          return (
            <Card key={d.id} className={`overflow-hidden transition-all ${isOpen ? 'ring-2 ring-teal-500' : ''}`}>
              {/* Header row */}
              <button className="w-full text-left p-4 flex items-start justify-between gap-3" onClick={() => setExpanded(isOpen ? null : d.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{d.id}</span>
                    <h3 className="font-bold text-slate-900 text-base">{d.name}</h3>
                    {d.zoonotic   && <span className="text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 px-1.5 py-0.5 rounded">ZOONOTIC</span>}
                    {d.notifiable && <span className="text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">NOTIFIABLE</span>}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">{d.pathogen} · {d.category}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {disAssocs.map(a => (
                      <span key={a.id} className="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                        {a.species?.name || a.speciesId}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 mt-0.5 text-slate-400">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                  {/* Symptoms */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Stethoscope size={13} />Clinical Presentation</h4>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1">
                      <FieldRow label="Incubation"        value={d.incubation} />
                      <FieldRow label="Early Symptoms"    value={d.earlySymptoms} />
                      <FieldRow label="Behavioural Signs" value={d.behavioralSigns} />
                      <FieldRow label="Physical Signs"    value={d.physicalSigns} />
                      <FieldRow label="Physiological"     value={d.physiologicalSigns} />
                      <FieldRow label="Mortality"         value={d.mortality} />
                      <FieldRow label="Productivity"      value={d.productivityImpact} />
                    </div>
                  </div>

                  {/* Transmission */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Transmission & Exposure</h4>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1">
                      <FieldRow label="Transmission"    value={d.transmission} />
                      <FieldRow label="Exposure Types"  value={d.exposureTypes?.join('; ')} />
                      <FieldRow label="Seasonality"     value={d.seasonality} />
                      <FieldRow label="Env. Risk"       value={d.environmentalRisk} />
                    </div>
                  </div>

                  {/* Camera / IoT */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Camera size={13} />Camera Signals</h4>
                      <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                        <div className="text-xs text-purple-800 font-medium">{d.cameraSignals || 'Not established in consulted source.'}</div>
                        <div className="text-[10px] text-purple-600 mt-1">Detectability: {d.cameraDetectabilityClass || '—'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Cpu size={13} />IoT / Sensor Signals</h4>
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                        <div className="text-xs text-blue-800 font-medium">{d.iotSignals || 'Not established in consulted source.'}</div>
                        <div className="text-[10px] text-blue-600 mt-1">Detectability: {d.iotDetectabilityClass || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostics & Control */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Shield size={13} />Diagnostics & Control</h4>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1">
                      <FieldRow label="Diagnostics"  value={d.diagnostics} />
                      <FieldRow label="Sample"       value={d.sample} />
                      <FieldRow label="Vaccination"  value={d.vaccination} />
                      <FieldRow label="Prevention"   value={d.prevention} />
                      <FieldRow label="Control"      value={d.control} />
                      <FieldRow label="Containment"  value={d.containment} />
                    </div>
                  </div>

                  {/* Species associations */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Species Associations ({disAssocs.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr>
                          <th className="px-3 py-2">Record ID</th><th className="px-3 py-2">Species</th>
                          <th className="px-3 py-2">Breeds</th><th className="px-3 py-2">Maharashtra Evidence</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {disAssocs.map(a => (
                            <tr key={a.id}>
                              <td className="px-3 py-2 font-mono text-slate-400">{a.id}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{a.species?.name}</td>
                              <td className="px-3 py-2 text-slate-600">{a.breedNote || 'All'}</td>
                              <td className="px-3 py-2"><EvidenceBadge text={a.evidence} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Maharashtra Evidence */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-xs font-bold text-slate-600 mb-0.5">Maharashtra Evidence</div>
                    <div className="text-xs text-slate-700">{d.maharashtraEvidence || 'Not established in consulted source.'}</div>
                    <EvidenceBadge text={d.evidenceStatus} />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
