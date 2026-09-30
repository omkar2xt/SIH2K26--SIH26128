import React, { useState, useEffect } from 'react';
import { Card, SectionTitle } from '../common/UIComponents';
import { api } from '../../services/api/api';
import { ShieldAlert, ChevronLeft, Activity, Info, Beaker, MapPin } from 'lucide-react';

const STATUS_COLORS = {
  'Laboratory Confirmed': 'bg-red-100 text-red-800 border-red-200',
  'Laboratory Pending': 'bg-orange-100 text-orange-800 border-orange-200',
  'Veterinary Investigation': 'bg-amber-100 text-amber-800 border-amber-200',
  'Potential Disease Risk': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Rejected': 'bg-slate-100 text-slate-500 border-slate-200'
};

const URGENCY_COLORS = {
  'RED': 'bg-red-500',
  'ORANGE': 'bg-orange-500',
  'YELLOW': 'bg-yellow-500',
  'GREEN': 'bg-emerald-500'
};

export default function DiseaseDetails({ diseaseId, setPage, liveData }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diseaseData, setDiseaseData] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.diseases.getAssociatedAnimals(diseaseId);
        if (res.success) {
          setDiseaseData(res);
        } else {
          setError(res.error?.message || 'Failed to load disease data');
        }
      } catch (e) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }
    
    if (diseaseId) {
      loadData();
    } else {
      setError('Invalid Disease ID');
      setLoading(false);
    }
  }, [diseaseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Activity className="animate-spin mb-4 text-teal-600" size={32} />
        <p className="font-semibold text-sm">Loading authoritative disease data...</p>
      </div>
    );
  }

  if (error || !diseaseData) {
    return (
      <div className="p-10 max-w-lg mx-auto bg-red-50 border border-red-200 rounded-xl text-center">
        <h3 className="text-red-800 font-bold mb-2">Failed to load</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={() => setPage('dashboard')} className="text-teal-700 underline text-sm">← Back to Dashboard</button>
      </div>
    );
  }

  const { data: animals, diseaseName, diseaseCode, diseaseDescription } = diseaseData;
  const filteredAnimals = animals.filter(a => a.status !== 'Rejected'); // optionally hide rejected

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4 mb-2">
        <button onClick={() => setPage('dashboard')} className="flex items-center gap-1 text-sm text-teal-700 hover:text-teal-900 font-semibold">
          <ChevronLeft size={16} /> Dashboard
        </button>
      </div>

      <SectionTitle 
        title="Disease Investigation & Associated Animals" 
        eyebrow="Epidemiology Context"
      />

      {/* Disease Header */}
      <Card className="p-6 border-t-4 border-t-red-600 bg-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-full shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{diseaseName}</h2>
            <div className="text-sm text-slate-500 font-mono mt-1 font-semibold">{diseaseCode}</div>
            <p className="mt-3 text-slate-700 text-sm max-w-3xl leading-relaxed">
              {diseaseDescription || "Disease investigation overview."}
            </p>
          </div>
        </div>
      </Card>

      {/* Associated Animals */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          Animals Currently Associated
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full border border-slate-200">
            {filteredAnimals.length} found
          </span>
        </h3>

        {filteredAnimals.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 bg-slate-50 border-dashed">
            <Info className="mx-auto mb-3 text-slate-400" size={32} />
            <p>No animals are currently associated with this disease risk.</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="p-0 hidden md:block overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Animal ID</th>
                    <th className="px-5 py-4">Species & Breed</th>
                    <th className="px-5 py-4">Farm / Location</th>
                    <th className="px-5 py-4">Current Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAnimals.map(a => (
                    <tr key={a.animalId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${URGENCY_COLORS[a.urgency] || 'bg-slate-400'}`}></div>
                          <span className="font-bold text-teal-800">{a.tagId || a.animalId}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{a.speciesName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{a.breedName || 'Mixed'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin size={14} className="text-slate-400" />
                          {a.farmName || 'Unknown Farm'}
                        </div>
                        <div className="text-xs text-slate-500 ml-5">{a.location}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[a.status] || STATUS_COLORS['Rejected']}`}>
                          {a.status}
                        </span>
                        {a.labStatus && a.labStatus !== 'No Lab Result' && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                            <Beaker size={12} className={a.labStatus === 'Positive' ? 'text-red-500' : 'text-slate-400'} />
                            Lab: {a.labStatus}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => setPage('animal-profile', a.animalId)} 
                          className="text-teal-700 font-bold hover:text-teal-800 text-xs uppercase tracking-wide hover:underline bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 transition-colors"
                        >
                          View Animal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredAnimals.map(a => (
                <Card key={a.animalId} className="p-4 relative overflow-hidden bg-white border-slate-200">
                  <div className={`absolute top-0 left-0 w-1 h-full ${URGENCY_COLORS[a.urgency] || 'bg-slate-400'}`}></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <div>
                      <div className="font-bold text-teal-800 text-base">{a.tagId || a.animalId}</div>
                      <div className="text-xs text-slate-500">{a.speciesName} · {a.breedName}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[a.status] || STATUS_COLORS['Rejected']}`}>
                      {a.status}
                    </span>
                  </div>
                  
                  <div className="pl-2 mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{a.farmName} — {a.location}</span>
                    </div>
                    {a.labStatus && a.labStatus !== 'No Lab Result' && (
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
                        <Beaker size={14} className={a.labStatus === 'Positive' ? 'text-red-500' : 'text-slate-400'} />
                        Lab: {a.labStatus}
                      </div>
                    )}
                  </div>
                  
                  <div className="pl-2 mt-4">
                    <button 
                      onClick={() => setPage('animal-profile', a.animalId)} 
                      className="w-full text-center text-teal-700 font-bold text-xs uppercase tracking-wide bg-teal-50 hover:bg-teal-100 py-2 rounded-lg border border-teal-100 transition-colors"
                    >
                      View Animal Profile
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
