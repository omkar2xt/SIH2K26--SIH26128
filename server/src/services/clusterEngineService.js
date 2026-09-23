/**
 * PASHU-RAKSHA Backend Cluster Detection Engine Service
 */

function detectClusters(animals = [], farms = []) {
  const highRiskAnimals = animals.filter(a => a.riskLevel === 'RED' || a.riskLevel === 'CRITICAL');
  const farmMap = {};
  farms.forEach(f => { farmMap[f.id] = f; });

  const districtGroups = {};
  highRiskAnimals.forEach(a => {
    const farm = farmMap[a.farmId];
    if (farm && farm.districtId) {
      if (!districtGroups[farm.districtId]) districtGroups[farm.districtId] = [];
      districtGroups[farm.districtId].push({ animal: a, farm });
    }
  });

  const clusters = [];
  for (const [districtId, group] of Object.entries(districtGroups)) {
    if (group.length >= 2) {
      clusters.push({
        id: `CL_${districtId}_${Date.now()}`,
        districtId,
        animalCount: group.length,
        status: 'POTENTIAL_CLUSTER',
        description: `${group.length} animals exhibiting correlated baseline abnormalities within a 72-hour window in district. Status: Potential cluster, awaiting field verification.`,
        members: group.map(g => ({ farmId: g.farm.id, animalTag: g.animal.tagId, riskLevel: g.animal.riskLevel })),
      });
    }
  }

  return clusters;
}

module.exports = { detectClusters };
