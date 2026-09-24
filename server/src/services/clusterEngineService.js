/**
 * PASHU-RAKSHA Backend Cluster Detection Engine Service
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detectClusters(animals = [], farms = []) {
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
      // Find existing cluster or create new one
      const existing = await prisma.cluster.findFirst({
        where: { districtId, status: { in: ['POTENTIAL_CLUSTER', 'CONFIRMED_OUTBREAK'] } }
      });

      if (!existing) {
        const cluster = await prisma.cluster.create({
          data: {
            code: `CL_${districtId}_${Date.now()}`,
            districtId,
            animalCount: group.length,
            status: 'POTENTIAL_CLUSTER',
            description: `${group.length} animals exhibiting correlated baseline abnormalities within a 72-hour window in district. Status: Potential cluster, awaiting field verification.`,
            members: {
              create: group.map(g => ({
                farmId: g.farm.id,
                animalTag: g.animal.tagId || g.animal.id,
                riskLevel: g.animal.riskLevel
              }))
            }
          }
        });
        clusters.push(cluster);
      } else {
        // Update animal count
        const updated = await prisma.cluster.update({
          where: { id: existing.id },
          data: { animalCount: group.length }
        });
        clusters.push(updated);
      }
    }
  }

  return clusters;
}

module.exports = { detectClusters };
