import React, { useState, useMemo } from 'react';
import { Network, AlertTriangle, Activity, ChevronRight } from 'lucide-react';
import { Card, SectionTitle, RiskBadge } from '../common/UIComponents';
import { runExposureEngine, getAnimalExposures } from '../../engine/exposureEngine';

const RISK_COLORS = { HIGH: 'border-red-500 bg-red-50', MEDIUM: 'border-amber-500 bg-amber-50', LOW: 'border-slate-300 bg-slate-50' };
const RISK_BADGE  = { HIGH: 'bg-red-100 text-red-800', MEDIUM: 'bg-amber-100 text-amber-800', LOW: 'bg-slate-100 text-slate-600' };

export default function ExposureIntelligence({ liveData, setPage }) {
  const [selected, setSelected] = useState(null);

  const enrichedEvents = useMemo(() => {
    return runExposureEngine(liveData);
  }, [liveData]);

  const highRisk   = enrichedEvents.filter(e => e.riskLevel === 'HIGH');
  const medRisk    = enrichedEvents.filter(e => e.riskLevel === 'MEDIUM');
  const sources    = [...new Set(enrichedEvents.map(e => e.sourceId))];

  // Group by source
  const bySource = useMemo(() => {
    const map = {};
    enrichedEvents.forEach(e => {
      if (!map[e.sourceId]) map[e.sourceId] = [];
      map[e.sourceId].push(e);
    });
    return map;
  }, [enrichedEvents]);

  const selAnimal  = selected && (liveData.animals || []).find(a => a.id === selected);
  const selEvents  = selected ? (bySource[selected] || enrichedEvents.filter(e => e.targetId === selected)) : [];

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Contact Tracing" title="Exposure Intelligence">
        <div className="flex gap-2">
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">High Risk: {highRisk.length}</span>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">Medium: {medRisk.length}</span>
        </div>
      </SectionTitle>

      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-xs text-blue-800 font-semibold">
        ℹ Exposure events represent proximity contact — not confirmed transmission. Disease context weighted by KB transmission type. Not a diagnosis.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-black text-slate-900">{enrichedEvents.length}</div>
          <div className="text-xs text-slate-500 font-semibold">Total Exposure Events</div>
        </Card>
        <Card className="p-4 text-center bg-red-50 border-red-200">
          <div className="text-2xl font-black text-red-800">{highRisk.length}</div>
          <div className="text-xs text-red-600 font-semibold">High-Risk Contacts</div>
        </Card>
        <Card className="p-4 text-center bg-amber-50 border-amber-200">
          <div className="text-2xl font-black text-amber-800">{sources.length}</div>
          <div className="text-xs text-amber-600 font-semibold">Source Animals</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Source animal list */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700">Source Animals ({sources.length})</h3>
          {sources.length === 0 && (
            <div className="py-6 text-center text-slate-400 text-sm">No exposure events recorded.</div>
          )}
          {sources.map(sid => {
            const animal   = (liveData.animals || []).find(a => a.id === sid);
            const events   = bySource[sid] || [];
            const maxRisk  = events.some(e => e.riskLevel === 'HIGH') ? 'HIGH' : events.some(e => e.riskLevel === 'MEDIUM') ? 'MEDIUM' : 'LOW';
            const riskLevel= animal?.riskEval?.healthRiskLevel || 'GREEN';
            return (
              <button key={sid} onClick={() => setSelected(selected === sid ? null : sid)}
                className={`w-full text-left rounded-xl border-l-4 p-3 transition-all ${selected === sid ? 'ring-2 ring-teal-500' : ''} ${RISK_COLORS[maxRisk]}`}>
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{sid}</div>
                    <div className="text-xs text-slate-500">{animal?.speciesId} · {events.length} contacts</div>
                  </div>
                  <div className="text-right">
                    <RiskBadge level={riskLevel} />
                    <div className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${RISK_BADGE[maxRisk]}`}>{maxRisk} EXPOSURE</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Contact detail */}
        <div className="lg:col-span-2 space-y-3">
          {!selected && (
            <div className="h-40 flex items-center justify-center text-slate-400">
              <div className="text-center"><Network size={32} className="mx-auto mb-2 text-slate-300" /><p className="text-sm">Select a source animal to view contacts</p></div>
            </div>
          )}
          {selected && (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-700">Contacts for {selected}</h3>
                <button onClick={() => { setPage('animal-profile', selected); }} className="text-xs text-teal-700 font-semibold hover:underline ml-auto">View Profile →</button>
              </div>
              {selEvents.map(e => {
                const other = e.sourceId === selected ? e.targetId : e.sourceId;
                const otherAnimal = (liveData.animals || []).find(a => a.id === other);
                const disease     = (liveData.diseases || []).find(d => d.id === e.diseaseId);
                const farm        = otherAnimal ? (liveData.farms || []).find(f => f.id === otherAnimal?.farmId) : null;
                return (
                  <Card key={e.id} className={`border-l-4 ${RISK_COLORS[e.riskLevel]}`}>
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            {e.sourceId === selected ? <ChevronRight size={14} className="text-red-500" /> : <Activity size={14} className="text-teal-500" />}
                            {other}
                          </div>
                          <div className="text-xs text-slate-500">{otherAnimal?.speciesId} · {farm?.name} · {farm?.district}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_BADGE[e.riskLevel]}`}>{e.riskLevel} RISK</span>
                          <div className="text-xs text-slate-400 mt-0.5">Score: {e.compositeRisk}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mt-2">
                        <div className="rounded bg-white border border-slate-200 p-2 text-center">
                          <div className="font-bold text-slate-900">{e.distance}m</div><div className="text-slate-400">Distance</div>
                        </div>
                        <div className="rounded bg-white border border-slate-200 p-2 text-center">
                          <div className="font-bold text-slate-900">{e.contacts}</div><div className="text-slate-400">Contacts</div>
                        </div>
                        <div className="rounded bg-white border border-slate-200 p-2 text-center">
                          <div className="font-bold text-slate-900">{e.duration}min</div><div className="text-slate-400">Duration</div>
                        </div>
                      </div>
                      {disease && (
                        <div className="mt-2 text-xs bg-white border border-slate-200 rounded p-2">
                          <span className="font-semibold text-slate-700">Disease context: </span>
                          <span className="text-slate-600">{disease.name}</span>
                          <span className="ml-2 text-slate-400">Transmission weight: ×{e.transmissionWeight}</span>
                        </div>
                      )}
                      <button onClick={() => setPage('animal-profile', other)} className="mt-2 text-xs text-teal-700 font-semibold hover:underline">
                        View {other} profile →
                      </button>
                    </div>
                  </Card>
                );
              })}
            </>
          )}

          {/* All exposure events table */}
          {!selected && enrichedEvents.length > 0 && (
            <Card className="overflow-x-auto p-0">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">All Exposure Events</h3>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Source</th><th className="px-4 py-2">Target</th>
                    <th className="px-4 py-2 text-right">Distance</th><th className="px-4 py-2 text-right">Contacts</th>
                    <th className="px-4 py-2">Disease</th><th className="px-4 py-2">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrichedEvents.map(e => {
                    const disease = (liveData.diseases || []).find(d => d.id === e.diseaseId);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-bold text-teal-800">{e.sourceId}</td>
                        <td className="px-4 py-2 font-bold text-slate-700">{e.targetId}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{e.distance}m</td>
                        <td className="px-4 py-2 text-right text-slate-600">{e.contacts}</td>
                        <td className="px-4 py-2 text-slate-500">{disease?.shortName || '—'}</td>
                        <td className="px-4 py-2"><span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${RISK_BADGE[e.riskLevel]}`}>{e.riskLevel}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
