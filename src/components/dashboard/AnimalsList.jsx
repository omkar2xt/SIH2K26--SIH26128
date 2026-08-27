import React, { useState } from 'react';
import { PawPrint, Plus } from 'lucide-react';
import { SectionTitle, Card, AnimalsTable } from '../common/UIComponents';

export default function AnimalsList({ liveData, setPage, addAnimal, role }) {
  const [showAdd, setShowAdd] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newAnimal = {
      id: formData.get("id"),
      farmId: formData.get("farmId") || "FARM_A",
      speciesId: formData.get("speciesId"),
      breedId: formData.get("breedId") || "BR_01",
      age: parseInt(formData.get("age")) || 3,
      sex: formData.get("sex"),
      baseline: { activity: 90, feeding: 90, movement: 85, rumination: 80 },
      current: { activity: 90, feeding: 90, movement: 85, rumination: 80, tempTrend: "normal", social: "normal" }
    };
    addAnimal(newAnimal);
    setShowAdd(false);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <SectionTitle title="Livestock Directory">
        {['farmer', 'field', 'admin'].includes(role) && (
          <button 
            onClick={() => setShowAdd(!showAdd)} 
            className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
          >
            <Plus size={16} /> Add Animal
          </button>
        )}
      </SectionTitle>

      {showAdd && (
        <Card className="p-6 mb-6 bg-teal-50/50 border-teal-100">
          <h3 className="text-sm font-bold text-teal-900 mb-4">Register New Animal</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <input required name="id" type="text" placeholder="Animal ID (e.g. MH-CAT-099)" className="p-2 text-sm border border-slate-200 rounded" />
              <select name="speciesId" className="p-2 text-sm border border-slate-200 rounded">
                <option value="SP_01">Cattle</option>
                <option value="SP_02">Buffalo</option>
                <option value="SP_03">Goat</option>
                <option value="SP_04">Sheep</option>
              </select>
              <input name="breedId" type="text" placeholder="Breed ID (e.g. BR_01)" className="p-2 text-sm border border-slate-200 rounded" />
              <input required name="age" type="number" placeholder="Age (years)" className="p-2 text-sm border border-slate-200 rounded" />
              <select name="sex" className="p-2 text-sm border border-slate-200 rounded">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-teal-700 text-white font-bold text-sm rounded hover:bg-teal-800">Save Animal</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-sm rounded hover:bg-slate-300">Cancel</button>
            </div>
          </form>
        </Card>
      )}
      
      <Card className="p-0">
        <AnimalsTable animals={liveData.animals} setPage={setPage} />
      </Card>
    </div>
  );
}
