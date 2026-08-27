import React from 'react';
import { SectionTitle, Card, RiskBadge } from '../common/UIComponents';
import { Network } from 'lucide-react';

export default function ExposureIntelligence({ liveData, setPage }) {
  const events = liveData.exposureEvents || [];

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle title="Exposure Intelligence Network" />
      
      <Card className="p-6 mb-6">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Network size={18} /> Network Overview</h3>
        <p className="text-sm text-slate-600 mb-4">
          The exposure engine calculates epidemiological risk based on duration, distance, frequency, and species compatibility.
        </p>
        
        {events.length > 0 ? (
          <div className="grid gap-4">
            {events.map((ev, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm">
                    <span className="font-bold text-teal-800">{ev.sourceId}</span>
                    <span className="text-slate-400 mx-2">→ exposed →</span>
                    <span className="font-bold text-teal-800">{ev.targetId}</span>
                  </div>
                  <RiskBadge level={ev.risk === "HIGH" ? "RED" : ev.risk === "MEDIUM" ? "ORANGE" : "YELLOW"} />
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Distance: {ev.distance}m | Duration: {ev.duration}h | Contacts: {ev.contacts} | Last: {ev.lastContact}
                </div>
                <div className="text-xs font-semibold text-red-700 bg-red-50 p-2 rounded">
                  Reasons: {ev.reasons?.join(', ') || "Multiple exposure vectors."}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-slate-50 text-slate-500 rounded-lg text-sm">
            No exposure events currently detected in the network.
          </div>
        )}
      </Card>
    </div>
  );
}
