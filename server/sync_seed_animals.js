const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncSeedAnimals() {
  console.log('--- SYNCING SEED ANIMALS INTO dev.db ---');

  // Find or create tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Maharashtra Animal Husbandry', slug: 'mh-gov', tenantType: 'GOVERNMENT' }
    });
  }

  // Find farmer user
  const farmer = await prisma.user.findFirst({ where: { username: 'test_farmer_a' } }) ||
                 await prisma.user.findFirst();

  // Find districts
  const districts = await prisma.district.findMany();
  const getDistrict = (name) => {
    return districts.find(d => d.name.toLowerCase().includes(name.toLowerCase())) || districts[0];
  };

  // Find species
  const allSpecies = await prisma.species.findMany({ include: { breeds: true } });
  const getSpecies = (name) => {
    return allSpecies.find(s => s.name.toLowerCase() === name.toLowerCase()) || allSpecies[0];
  };

  // 1. Farms to sync
  const farmsToSync = [
    { code: 'FARM-D-NGP', name: 'Rathi Buffalo Farm', districtName: 'Nagpur', lat: 21.21, lng: 79.18 },
    { code: 'FARM-E-CSN', name: 'Kadam Gaushala', districtName: 'Sambhajinagar', lat: 19.88, lng: 75.34 },
    { code: 'FARM-C-KOL', name: 'Jadhav Sheep & Goat Unit', districtName: 'Kolhapur', lat: 16.70, lng: 74.23 },
    { code: 'FARM-B-PUN', name: 'Patil Livestock', districtName: 'Pune', lat: 18.15, lng: 74.57 },
  ];

  const farmMap = {};
  for (const f of farmsToSync) {
    const dist = getDistrict(f.districtName);
    let farm = await prisma.farm.findFirst({ where: { name: f.name } });
    if (!farm) {
      farm = await prisma.farm.create({
        data: {
          code: f.code,
          name: f.name,
          districtId: dist.id,
          tenantId: tenant.id,
          ownerId: farmer.id,
          latitude: f.lat,
          longitude: f.lng,
          address: `${f.name}, Maharashtra`
        }
      });
    }
    farmMap[f.name] = farm;
  }

  // Main Deshmukh farm
  const deshmukhFarm = await prisma.farm.findFirst({
    where: { name: { contains: 'Deshmukh' } }
  });
  if (deshmukhFarm) {
    farmMap['Deshmukh Dairy & Cattle Farm'] = deshmukhFarm;
    farmMap['Deshmukh Dairy'] = deshmukhFarm;
  }

  // 2. Animals to sync
  const animalsToSync = [
    {
      tagId: 'MH-BUF-009',
      farmName: 'Rathi Buffalo Farm',
      speciesName: 'Buffalo',
      gender: 'FEMALE',
      ageMonths: 72,
      healthStatus: 'CRITICAL',
      riskLevel: 'RED',
      obsNote: 'Severe recumbency, 67% activity drop, breathing laboured'
    },
    {
      tagId: 'MH-BUF-022',
      farmName: 'Kadam Gaushala',
      speciesName: 'Buffalo',
      gender: 'FEMALE',
      ageMonths: 60,
      healthStatus: 'WATCH',
      riskLevel: 'ORANGE',
      obsNote: 'Sluggish behavior, 31% activity drop, elevated temperature'
    },
    {
      tagId: 'MH-SHP-061',
      farmName: 'Jadhav Sheep & Goat Unit',
      speciesName: 'Sheep',
      gender: 'MALE',
      ageMonths: 24,
      healthStatus: 'WATCH',
      riskLevel: 'YELLOW',
      obsNote: 'Runny nose, mild activity drop (18%), reduced feeding'
    },
    {
      tagId: 'MH-CAT-078',
      farmName: 'Patil Livestock',
      speciesName: 'Cattle',
      gender: 'FEMALE',
      ageMonths: 60,
      healthStatus: 'HEALTHY',
      riskLevel: 'YELLOW',
      obsNote: '27% activity drop vs baseline, monitor closely'
    },
    {
      tagId: 'MH-BUF-017',
      farmName: 'Rathi Buffalo Farm',
      speciesName: 'Buffalo',
      gender: 'FEMALE',
      ageMonths: 48,
      healthStatus: 'HEALTHY',
      riskLevel: 'GREEN',
      obsNote: 'Normal activity and feeding'
    },
    {
      tagId: 'MH-CAT-089',
      farmName: 'Kadam Gaushala',
      speciesName: 'Cattle',
      gender: 'FEMALE',
      ageMonths: 36,
      healthStatus: 'HEALTHY',
      riskLevel: 'GREEN',
      obsNote: 'Normal baseline reading'
    },
    {
      tagId: 'MH-CAT-063',
      farmName: 'Patil Livestock',
      speciesName: 'Cattle',
      gender: 'FEMALE',
      ageMonths: 48,
      healthStatus: 'HEALTHY',
      riskLevel: 'GREEN',
      obsNote: 'Normal baseline reading'
    },
    {
      tagId: 'MH-GOT-102',
      farmName: 'Jadhav Sheep & Goat Unit',
      speciesName: 'Goat',
      gender: 'FEMALE',
      ageMonths: 24,
      healthStatus: 'WATCH',
      riskLevel: 'YELLOW',
      obsNote: 'Field verification recommended'
    },
    {
      tagId: 'MH-SHP-055',
      farmName: 'Jadhav Sheep & Goat Unit',
      speciesName: 'Sheep',
      gender: 'MALE',
      ageMonths: 36,
      healthStatus: 'HEALTHY',
      riskLevel: 'GREEN',
      obsNote: 'Normal baseline reading'
    },
    {
      tagId: 'MH-CAT-031',
      farmName: 'Deshmukh Dairy & Cattle Farm',
      speciesName: 'Cattle',
      gender: 'FEMALE',
      ageMonths: 36,
      healthStatus: 'HEALTHY',
      riskLevel: 'GREEN',
      obsNote: 'Normal baseline reading'
    },
    {
      tagId: 'MH-CAT-014',
      farmName: 'Deshmukh Dairy & Cattle Farm',
      speciesName: 'Cattle',
      gender: 'FEMALE',
      ageMonths: 60,
      healthStatus: 'HEALTHY',
      riskLevel: 'GREEN',
      obsNote: 'Normal baseline reading'
    }
  ];

  for (const a of animalsToSync) {
    const sp = getSpecies(a.speciesName);
    const br = sp.breeds?.[0];
    const farm = farmMap[a.farmName] || deshmukhFarm;

    let animal = await prisma.animal.findFirst({ where: { tagId: a.tagId } });
    if (!animal) {
      animal = await prisma.animal.create({
        data: {
          tagId: a.tagId,
          speciesId: sp.id,
          breedId: br?.id || null,
          farmId: farm.id,
          gender: a.gender,
          ageMonths: a.ageMonths,
          healthStatus: a.healthStatus,
          riskLevel: a.riskLevel
        }
      });
      console.log(`  ✔ Seeded animal: ${a.tagId} (UUID: ${animal.id}) on ${farm.name}`);
    } else {
      console.log(`  - Animal ${a.tagId} already exists (UUID: ${animal.id})`);
    }

    // Add baseline observation if none exists
    const obsCount = await prisma.healthObservation.count({ where: { animalId: animal.id } });
    if (obsCount === 0) {
      await prisma.healthObservation.create({
        data: {
          animalId: animal.id,
          observerId: farmer.id,
          activityLevel: a.riskLevel === 'RED' ? 30 : a.riskLevel === 'ORANGE' ? 55 : 85,
          feedingMinutes: a.riskLevel === 'RED' ? 20 : 80,
          movementMeters: a.riskLevel === 'RED' ? 25 : 80,
          ruminationMinutes: a.riskLevel === 'RED' ? 15 : 75,
          temperatureCelsius: a.riskLevel === 'RED' ? 40.5 : 38.6,
          notes: a.obsNote,
          timestamp: new Date()
        }
      });
    }
  }

  console.log('--- ALL SEED ANIMALS SYNCHRONIZED SUCCESSFULLY ---');
}

syncSeedAnimals()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
