export function validateKnowledgeBaseData(species: any[] = [], breeds: any[] = [], diseases: any[] = []) {
  const speciesIds = new Set(species.map(s => s.id || s.code));
  let orphanBreeds = 0;

  breeds.forEach(b => {
    if (!speciesIds.has(b.speciesId)) orphanBreeds++;
  });

  return {
    valid: orphanBreeds === 0,
    speciesCount: species.length,
    breedsCount: breeds.length,
    diseasesCount: diseases.length,
    orphanBreedsCount: orphanBreeds,
    validatedAt: new Date().toISOString(),
  };
}
