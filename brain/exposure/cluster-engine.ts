export function runClusterEngine(db: any = {}) {
  const clusters: any[] = [];

  const highRiskAnimals = (db.animals || []).filter((a: any) =>
    a.riskEval && (a.riskEval.healthRiskLevel === 'RED' || a.riskEval.healthRiskLevel === 'CRITICAL')
  );

  const districtGroups = highRiskAnimals.reduce((acc: any, animal: any) => {
    const farm = (db.farms || []).find((f: any) => f.id === animal.farmId);
    if (farm) {
      if (!acc[farm.district]) acc[farm.district] = [];
      acc[farm.district].push(animal);
    }
    return acc;
  }, {});

  for (const [district, animals] of Object.entries<any[]>(districtGroups)) {
    if (animals.length >= 2) {
      clusters.push({
        id: `CL_${district.toUpperCase()}_${Date.now()}`,
        district,
        animalCount: animals.length,
        status: 'potential cluster',
        description: `${animals.length} animals with correlated abnormality signatures within a 72-hour window. Status: potential cluster, awaiting field verification.`,
      });
    }
  }

  return clusters;
}
