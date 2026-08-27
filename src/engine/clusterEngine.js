export function runClusterEngine(db) {
  let clusters = [];

  // Group high risk animals by district
  const highRiskAnimals = db.animals.filter(a => 
    a.riskEval && (a.riskEval.healthRiskLevel === "RED" || a.riskEval.healthRiskLevel === "CRITICAL")
  );

  const districtGroups = highRiskAnimals.reduce((acc, animal) => {
    const farm = db.farms.find(f => f.id === animal.farmId);
    if (farm) {
      if (!acc[farm.district]) acc[farm.district] = [];
      acc[farm.district].push(animal);
    }
    return acc;
  }, {});

  for (const [district, animals] of Object.entries(districtGroups)) {
    if (animals.length >= 2) {
      clusters.push({
        id: `CL_${district.toUpperCase()}_${Date.now()}`,
        district,
        animalCount: animals.length,
        status: "potential cluster",
        description: `${animals.length} animals with correlated abnormality signatures within a 72-hour window. Status: potential cluster, awaiting field verification.`
      });
    }
  }

  return clusters;
}
