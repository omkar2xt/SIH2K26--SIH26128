export interface SpeciesRecord {
  id: string;
  code: string;
  name: string;
  group: string;
  relevance: string;
  scientificName?: string;
}

export interface BreedRecord {
  id: string;
  speciesId: string;
  name: string;
  type?: string;
  status?: string;
  accession?: string;
}

export interface DiseaseRecord {
  id: string;
  name: string;
  shortName?: string;
  category?: string;
  zoonotic: boolean;
  notifiable: boolean;
  earlySymptoms?: string;
  behavioralSigns?: string;
  physicalSigns?: string;
  transmission?: string;
  exposureTypes?: string[];
  cameraSignals?: string;
  iotSignals?: string;
  diagnostics?: string;
  vaccination?: string;
  prevention?: string;
  containment?: string;
  evidence?: string;
}

export interface DiseaseSpeciesAssociation {
  recordCode: string;
  diseaseId: string;
  speciesId: string;
  evidence: string;
}
