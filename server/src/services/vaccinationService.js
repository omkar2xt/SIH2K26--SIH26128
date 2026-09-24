/**
 * vaccinationService.js (server) — Backend vaccination business logic
 * 
 * Provides RBAC isolation for vaccination records, strict deduplication, 
 * and calculation of real coverage statistics.
 * 
 * MEDICAL SEMANTICS:
 * Vaccination records are purely preventive health events. They do NOT
 * automatically declare an animal immune or alter Brain risk levels.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Resource Scope — Prisma where clause by authenticated role
// ─────────────────────────────────────────────────────────────────────────────

function getVaccinationScope(user) {
  switch (user.role) {
    case 'FARMER':
      // Can only see vaccinations for animals they own
      return { animal: { farm: { ownerId: user.userId } } };
    case 'VETERINARIAN':
    case 'FIELD_WORKER':
      // Broad access for vets/field workers (ideally scoped to assigned districts or cases in the future)
      return {};
    case 'DISTRICT_OFFICIAL':
    case 'STATE_OFFICIAL':
    case 'ADMIN':
      return {}; // Full access
    default:
      return { id: 'NEVER' }; // Deny unknown roles
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Authorization / Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks if user is allowed to administer a vaccine to this animal.
 */
async function getAuthorizedAnimal(animalId, user) {
  const scope = {};
  if (user.role === 'FARMER') {
    scope.farm = { ownerId: user.userId };
  }
  return prisma.animal.findFirst({
    where: { id: animalId, ...scope },
    include: { farm: { include: { district: true } } }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Coverage Statistics (Backend aggregation)
// ─────────────────────────────────────────────────────────────────────────────

async function calculateCoverageStats(user) {
  const scope = getVaccinationScope(user);

  // Note: For a real production app with millions of records, you would use 
  // Prisma aggregation/group_by queries. We fetch and aggregate in JS here 
  // to closely match the current frontend visualization expectations without 
  // changing the underlying schema structure.

  const records = await prisma.vaccinationRecord.findMany({
    where: scope,
    include: {
      animal: { include: { farm: { include: { district: true } } } },
      vaccine: true
    }
  });

  const today = new Date();
  
  // Calculate overdue animals
  const overdueRecords = records.filter(v => v.nextDueDate && v.nextDueDate < today);
  const overdueAnimals = [...new Set(overdueRecords.map(v => v.animalId))];

  // Calculate by District
  const districtMap = {};
  const animals = await prisma.animal.findMany({
    where: user.role === 'FARMER' ? { farm: { ownerId: user.userId } } : {},
    include: { farm: { include: { district: true } } }
  });

  animals.forEach(a => {
    const districtName = a.farm?.district?.name || 'Unknown';
    if (!districtMap[districtName]) {
      districtMap[districtName] = { total: 0, vaccinated: 0 };
    }
    districtMap[districtName].total++;
    
    // Check if animal has a current vaccine
    const animalVacs = records.filter(r => r.animalId === a.id);
    const hasCurrent = animalVacs.some(v => !v.nextDueDate || v.nextDueDate >= today);
    if (hasCurrent) {
      districtMap[districtName].vaccinated++;
    }
  });

  const byDistrict = Object.entries(districtMap).map(([district, data]) => ({
    district,
    coverage: data.total > 0 ? Math.round((data.vaccinated / data.total) * 100) : 0
  })).sort((a, b) => b.coverage - a.coverage);

  // Calculate by Disease (Vaccine Name for now)
  const diseaseMap = {};
  records.forEach(r => {
    const vName = r.vaccineName || (r.vaccine?.name) || 'Unknown';
    if (!diseaseMap[vName]) diseaseMap[vName] = new Set();
    diseaseMap[vName].add(r.animalId);
  });
  
  const totalAnimals = animals.length;
  const byDisease = Object.entries(diseaseMap).map(([disease, animalSet]) => ({
    disease,
    coverage: totalAnimals > 0 ? Math.round((animalSet.size / totalAnimals) * 100) : 0
  })).sort((a, b) => b.coverage - a.coverage);

  return {
    totalRecords: records.length,
    overdueAnimalsCount: overdueAnimals.length,
    byDistrict,
    byDisease
  };
}

module.exports = {
  getVaccinationScope,
  getAuthorizedAnimal,
  calculateCoverageStats
};
