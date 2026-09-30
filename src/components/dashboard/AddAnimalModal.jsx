import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api/api';

export default function AddAnimalModal({ isOpen, onClose, onSuccess, farms }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [species, setSpecies] = useState([]);
  
  const [formData, setFormData] = useState({
    tagId: '',
    speciesId: '',
    breedId: '',
    farmId: farms?.length > 0 ? farms[0].id : '',
    gender: 'FEMALE',
    ageMonths: '',
    weightKg: '',
    productionStage: '',
    healthStatus: 'HEALTHY'
  });

  useEffect(() => {
    if (isOpen) {
      api.species.getAll().then(res => {
        setSpecies(Array.isArray(res) ? res : (res.data || []));
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        ageMonths: formData.ageMonths ? parseInt(formData.ageMonths, 10) : 0,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
      };
      
      if (!payload.breedId) delete payload.breedId;
      if (!payload.weightKg) delete payload.weightKg;
      if (!payload.productionStage) delete payload.productionStage;

      const res = await api.animals.create(payload);
      if (res.success === false) {
        throw new Error(res.error?.message || 'Failed to create animal');
      }
      onSuccess(res.data || res);
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedSpecies = species.find(s => s.id === formData.speciesId);
  const breeds = selectedSpecies?.breeds || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Add New Animal</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <form id="add-animal-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Animal Tag / ID *</label>
                <input required type="text" name="tagId" value={formData.tagId} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm" placeholder="e.g. MH-CAT-099" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Farm *</label>
                <select required name="farmId" value={formData.farmId} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm bg-white">
                  <option value="">Select a Farm</option>
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Species *</label>
                <select required name="speciesId" value={formData.speciesId} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm bg-white">
                  <option value="">Select Species</option>
                  {species.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Breed</label>
                <select name="breedId" value={formData.breedId} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm bg-white" disabled={!formData.speciesId}>
                  <option value="">Select Breed (Optional)</option>
                  {breeds.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Gender *</label>
                <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm bg-white">
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Age (Months) *</label>
                <input required type="number" min="0" name="ageMonths" value={formData.ageMonths} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm" placeholder="e.g. 24" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Weight (Kg)</label>
                <input type="number" step="0.1" min="0" name="weightKg" value={formData.weightKg} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm" placeholder="e.g. 450.5" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Production Stage</label>
                <input type="text" name="productionStage" value={formData.productionStage} onChange={handleChange} className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow text-sm" placeholder="e.g. Lactating" />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-animal-form" disabled={loading} className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Animal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
