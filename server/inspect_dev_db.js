const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  console.log('--- INSPECTING dev.db ---');

  const counts = {
    users: await prisma.user.count(),
    farms: await prisma.farm.count(),
    animals: await prisma.animal.count(),
    species: await prisma.species.count(),
    breeds: await prisma.breed.count(),
    diseases: await prisma.disease.count(),
    observations: await prisma.healthObservation.count(),
    events: await prisma.healthEvent.count(),
    snapshots: await prisma.eventSnapshot.count(),
    alerts: await prisma.alert.count(),
    cases: await prisma.case.count(),
    labOrders: await prisma.labOrder.count(),
    labSamples: await prisma.labSample.count(),
    labTests: await prisma.labTest.count(),
    labResults: await prisma.labResult.count(),
    vaccinations: await prisma.vaccinationRecord.count(),
  };

  console.log('\n--- COUNTS ---');
  console.table(counts);

  console.log('\n--- DEMO DATA ---');
  const farmer = await prisma.user.findUnique({ where: { username: 'test_farmer_a' }});
  console.log('Farmer test_farmer_a:', !!farmer);

  const vet = await prisma.user.findUnique({ where: { username: 'dr_kulkarni' }});
  console.log('Vet dr_kulkarni:', !!vet);

  const admin = await prisma.user.findUnique({ where: { username: 'admin' }});
  console.log('Admin admin:', !!admin);

  const farm = await prisma.farm.findUnique({ where: { code: 'FARM-PN-001' }});
  console.log('Farm FARM-PN-001:', farm ? `Found (ownerId: ${farm.ownerId})` : 'Not Found');

  const animal = await prisma.animal.findUnique({ 
    where: { tagId: 'MH-CAT-027' },
    include: { farm: true }
  });
  console.log('Animal MH-CAT-027:', animal ? `Found (farmId: ${animal.farmId}, name: ${animal.name})` : 'Not Found');

  if (farmer && farm && farm.ownerId !== farmer.id) {
    console.log('WARNING: Farm ownerId does not match test_farmer_a id!');
  }

  const animalObs = await prisma.healthObservation.count({ where: { animalId: animal?.id }});
  console.log(`Observations for MH-CAT-027: ${animalObs}`);

  const animalAlerts = await prisma.alert.count({ where: { animalTag: animal?.tagId }});
  console.log(`Alerts for MH-CAT-027: ${animalAlerts}`);
  
  const animalCases = await prisma.case.count({ where: { animalId: animal?.id }});
  console.log(`Cases for MH-CAT-027: ${animalCases}`);

  console.log('\n--- ORPHANS & DUPLICATES ---');
  // Just quick checks for missing farm/animal etc
  const orphanAnimals = await prisma.animal.count({ where: { farmId: null }});
  console.log(`Orphan Animals (no farm): ${orphanAnimals}`);

  await prisma.$disconnect();
}

inspect().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
