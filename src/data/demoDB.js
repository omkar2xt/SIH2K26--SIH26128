// PASHU-RAKSHA Central Data Architecture - FINAL KB INTEGRATION

export const DEMO_DB_INITIAL = {
  species: [
    { id: "SP_01", name: "Cattle", group: "Bovine", relevance: "High" },
    { id: "SP_02", name: "Buffalo", group: "Bovine", relevance: "High" },
    { id: "SP_03", name: "Goat", group: "Caprine", relevance: "High" },
    { id: "SP_04", name: "Sheep", group: "Ovine", relevance: "High" },
    { id: "SP_05", name: "Pig", group: "Porcine", relevance: "Medium" },
    { id: "SP_06", name: "Horse", group: "Equine", relevance: "Medium" },
    { id: "SP_07", name: "Donkey", group: "Equine", relevance: "Medium" },
    { id: "SP_08", name: "Pony", group: "Equine", relevance: "Low" },
    { id: "SP_09", name: "Mule", group: "Equine", relevance: "Low" },
    { id: "SP_10", name: "Camel", group: "Camelid", relevance: "Low" },
    { id: "SP_11", name: "Rabbit", group: "Lagomorph", relevance: "Low" },
    { id: "SP_12", name: "Chicken", group: "Poultry", relevance: "High" },
    { id: "SP_13", name: "Duck", group: "Poultry", relevance: "Medium" },
    { id: "SP_14", name: "Turkey", group: "Poultry", relevance: "Low" },
    { id: "SP_15", name: "Quail", group: "Poultry", relevance: "Low" },
    { id: "SP_16", name: "Other poultry", group: "Poultry", relevance: "Low" }
  ],

  breeds: [
    { id: "BR_01", speciesId: "SP_01", name: "Khillar", type: "Indigenous" },
    { id: "BR_02", speciesId: "SP_01", name: "Deoni", type: "Indigenous" },
    { id: "BR_03", speciesId: "SP_01", name: "Dangi", type: "Indigenous" },
    { id: "BR_04", speciesId: "SP_01", name: "Red Kandhari", type: "Indigenous" },
    { id: "BR_05", speciesId: "SP_01", name: "Gaolao", type: "Indigenous" },
    { id: "BR_06", speciesId: "SP_01", name: "Kathani", type: "Indigenous" },
    { id: "BR_07", speciesId: "SP_01", name: "Konkan Kapila", type: "Indigenous" },
    { id: "BR_08", speciesId: "SP_01", name: "Umarda", type: "Indigenous" },
    { id: "BR_09", speciesId: "SP_02", name: "Pandharpuri", type: "Indigenous" },
    { id: "BR_10", speciesId: "SP_02", name: "Nagpuri", type: "Indigenous" },
    { id: "BR_11", speciesId: "SP_02", name: "Marathwadi", type: "Indigenous" },
    { id: "BR_12", speciesId: "SP_02", name: "Purnathadi", type: "Indigenous" },
    { id: "BR_13", speciesId: "SP_02", name: "Melghati", type: "Indigenous" },
    { id: "BR_14", speciesId: "SP_03", name: "Osmanabadi", type: "Indigenous" },
    { id: "BR_15", speciesId: "SP_03", name: "Sangamneri", type: "Indigenous" },
    { id: "BR_16", speciesId: "SP_03", name: "Berari", type: "Indigenous" },
    { id: "BR_17", speciesId: "SP_03", name: "Konkan Kanyal", type: "Indigenous" },
    { id: "BR_18", speciesId: "SP_04", name: "Madgyal", type: "Indigenous" },
    { id: "BR_19", speciesId: "SP_04", name: "Deccani", type: "Indigenous" },
    { id: "BR_20", speciesId: "SP_06", name: "Bhimthadi", type: "Indigenous" }
  ],

  diseases: [
    { id: "DIS_01", name: "Foot and Mouth Disease", pathogen: "Aphthovirus", category: "Viral / Infectious", zoonotic: false, notifiable: true },
    { id: "DIS_02", name: "Haemorrhagic Septicaemia", pathogen: "Pasteurella multocida", category: "Bacterial / Infectious", zoonotic: false, notifiable: true },
    { id: "DIS_03", name: "Lumpy Skin Disease", pathogen: "Capripoxvirus", category: "Viral / Infectious", zoonotic: false, notifiable: true },
    { id: "DIS_04", name: "Brucellosis", pathogen: "Brucella abortus", category: "Bacterial / Infectious", zoonotic: true, notifiable: true },
    { id: "DIS_05", name: "Leptospirosis", pathogen: "Leptospira spp.", category: "Bacterial / Infectious", zoonotic: true, notifiable: false },
    { id: "DIS_06", name: "Peste des petits ruminants", pathogen: "Morbillivirus", category: "Viral / Infectious", zoonotic: false, notifiable: true },
    { id: "DIS_07", name: "Glanders", pathogen: "Burkholderia mallei", category: "Bacterial / Infectious", zoonotic: true, notifiable: true },
    { id: "DIS_08", name: "African Swine Fever", pathogen: "Asfivirus", category: "Viral / Infectious", zoonotic: false, notifiable: true },
    { id: "DIS_09", name: "Rabies", pathogen: "Lyssavirus", category: "Viral / Infectious", zoonotic: true, notifiable: true },
    { id: "DIS_10", name: "Black Quarter", pathogen: "Clostridium chauvoei", category: "Bacterial / Infectious", zoonotic: false, notifiable: true },
    { id: "DIS_11", name: "Anthrax", pathogen: "Bacillus anthracis", category: "Bacterial / Infectious", zoonotic: true, notifiable: true },
    { id: "DIS_12", name: "Japanese Encephalitis", pathogen: "Flavivirus", category: "Viral / Vector-borne", zoonotic: true, notifiable: true },
    { id: "DIS_13", name: "Babesiosis", pathogen: "Babesia spp.", category: "Parasitic / Vector-borne", zoonotic: false, notifiable: false },
    { id: "DIS_14", name: "Theileriosis", pathogen: "Theileria spp.", category: "Parasitic / Vector-borne", zoonotic: false, notifiable: false },
    { id: "DIS_15", name: "Trypanosomiasis (Surra)", pathogen: "Trypanosoma evansi", category: "Parasitic / Vector-borne", zoonotic: false, notifiable: false },
    { id: "DIS_16", name: "Enterotoxaemia", pathogen: "Clostridium perfringens", category: "Bacterial / Infectious", zoonotic: false, notifiable: false }
  ],

  diseaseSpecies: [
    { diseaseId: "DIS_01", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_01", speciesId: "SP_02", evidence: "Confirmed" },
    { diseaseId: "DIS_01", speciesId: "SP_03", evidence: "Confirmed" },
    { diseaseId: "DIS_01", speciesId: "SP_04", evidence: "Confirmed" },
    { diseaseId: "DIS_01", speciesId: "SP_05", evidence: "Confirmed" },
    { diseaseId: "DIS_02", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_02", speciesId: "SP_02", evidence: "Confirmed" },
    { diseaseId: "DIS_03", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_03", speciesId: "SP_02", evidence: "Confirmed" },
    { diseaseId: "DIS_04", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_04", speciesId: "SP_02", evidence: "Confirmed" },
    { diseaseId: "DIS_05", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_05", speciesId: "SP_02", evidence: "Confirmed" },
    { diseaseId: "DIS_06", speciesId: "SP_03", evidence: "Confirmed" },
    { diseaseId: "DIS_06", speciesId: "SP_04", evidence: "Confirmed" },
    { diseaseId: "DIS_07", speciesId: "SP_06", evidence: "Confirmed" },
    { diseaseId: "DIS_07", speciesId: "SP_07", evidence: "Confirmed" },
    { diseaseId: "DIS_07", speciesId: "SP_08", evidence: "Confirmed" },
    { diseaseId: "DIS_07", speciesId: "SP_09", evidence: "Confirmed" },
    { diseaseId: "DIS_08", speciesId: "SP_05", evidence: "Confirmed" },
    { diseaseId: "DIS_09", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_09", speciesId: "SP_02", evidence: "Confirmed" },
    { diseaseId: "DIS_10", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_11", speciesId: "SP_01", evidence: "Confirmed" },
    { diseaseId: "DIS_11", speciesId: "SP_04", evidence: "Confirmed" },
    { diseaseId: "DIS_12", speciesId: "SP_05", evidence: "Confirmed" },
    { diseaseId: "DIS_13", speciesId: "SP_01", evidence: "Confirmed in supplied evidence set" },
    { diseaseId: "DIS_13", speciesId: "SP_02", evidence: "Confirmed in supplied evidence set" },
    { diseaseId: "DIS_14", speciesId: "SP_01", evidence: "Confirmed in supplied evidence set" },
    { diseaseId: "DIS_14", speciesId: "SP_02", evidence: "Confirmed in supplied evidence set" },
    { diseaseId: "DIS_15", speciesId: "SP_01", evidence: "India-relevant; Maharashtra-specific animal-level evidence not established" },
    { diseaseId: "DIS_15", speciesId: "SP_02", evidence: "India-relevant; Maharashtra-specific evidence not established" },
    { diseaseId: "DIS_15", speciesId: "SP_06", evidence: "India-relevant; Maharashtra-specific evidence not established" }
  ],

  farms: [
    { id: "FARM_A", name: "Deshmukh Dairy", district: "Nashik", lat: 20.0, lng: 73.8, contact: "R. Deshmukh" },
    { id: "FARM_B", name: "Patil Livestock", district: "Pune", lat: 18.5, lng: 73.9, contact: "S. Patil" }
  ],

  animals: [
    { id: "MH-CAT-027", farmId: "FARM_A", speciesId: "SP_01", breedId: "BR_01", age: 4, sex: "Female", 
      baseline: { activity: 92, feeding: 88, movement: 85, rumination: 78 },
      current: { activity: 52, feeding: 45, movement: 40, rumination: 30, tempTrend: "elevated", social: "isolating" }
    },
    { id: "MH-CAT-014", farmId: "FARM_A", speciesId: "SP_01", breedId: "BR_02", age: 3, sex: "Female",
      baseline: { activity: 90, feeding: 85, movement: 82, rumination: 75 },
      current: { activity: 90, feeding: 85, movement: 82, rumination: 75, tempTrend: "normal", social: "normal" }
    },
    { id: "MH-BUF-009", farmId: "FARM_B", speciesId: "SP_02", breedId: "BR_09", age: 5, sex: "Female",
      baseline: { activity: 85, feeding: 80, movement: 75, rumination: 70 },
      current: { activity: 30, feeding: 20, movement: 25, rumination: 15, tempTrend: "elevated", social: "recumbent" }
    },
    { id: "MH-SHP-055", farmId: "FARM_B", speciesId: "SP_04", breedId: "BR_19", age: 2, sex: "Male",
      baseline: { activity: 95, feeding: 90, movement: 90, rumination: 80 },
      current: { activity: 95, feeding: 90, movement: 90, rumination: 80, tempTrend: "normal", social: "normal" }
    }
  ],

  observations: [],
  cameraObservations: [],
  iotReadings: [],
  
  alerts: [
    { id: "AL_001", animalId: "MH-CAT-027", severity: "RED", createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), status: "OPEN" },
    { id: "AL_002", animalId: "MH-BUF-009", severity: "CRITICAL", createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), status: "OPEN" },
    { id: "AL_003", animalId: "MH-SHP-055", severity: "ORANGE", createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), status: "ACKNOWLEDGED" },
    { id: "AL_004", animalId: "MH-CAT-014", severity: "YELLOW", createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), status: "OPEN" },
    { id: "AL_005", animalId: "MH-BUF-012", severity: "RED", createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), status: "RESOLVED" }
  ],
  
  exposureEvents: [
    { sourceId: "MH-BUF-009", targetId: "MH-CAT-014", distance: 4.2, contacts: 3, duration: 15, lastContact: "2 hours ago" }
  ],
  
  cases: [
    { id: "CASE_001", animalId: "MH-BUF-009", stage: "Field Review", suspectedDisease: "DIS_02", notes: "Awaiting sample collection" }
  ],
  
  labSamples: [],
  labResults: [],
  vaccinations: [],
  treatments: [],
  
  districts: [
    { id: "Nashik", risk: "ORANGE", farms: 1, animals: 2 },
    { id: "Pune", risk: "RED", farms: 1, animals: 2 },
    { id: "Nagpur", risk: "GREEN", farms: 0, animals: 0 }
  ],
  
  clusters: [],
  weather: [
    { district: "Nashik", temp: 32, humidity: 65, condition: "Sunny" },
    { district: "Pune", temp: 30, humidity: 70, condition: "Cloudy" }
  ]
};
