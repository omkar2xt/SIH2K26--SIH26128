// PASHU-RAKSHA Prisma Database Seeder
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PASHU-RAKSHA master & operational database...');

  // 1. Roles
  const rolesData = [
    { name: 'FARMER' },
    { name: 'FIELD_WORKER' },
    { name: 'VETERINARIAN' },
    { name: 'DISTRICT_OFFICIAL' },
    { name: 'STATE_OFFICIAL' },
    { name: 'ADMIN' },
  ];

  const roles = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log('✔ Roles seeded.');

  // 2. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'mh-gov' },
    update: {},
    create: {
      name: 'Maharashtra State Animal Husbandry Department',
      slug: 'mh-gov',
      tenantType: 'GOVERNMENT',
    },
  });

  // 3. Country, Region, District
  const country = await prisma.country.upsert({
    where: { code: 'IND' },
    update: {},
    create: { code: 'IND', name: 'India' },
  });

  const region = await prisma.region.upsert({
    where: { countryId_code: { countryId: country.id, code: 'MH' } },
    update: {},
    create: { countryId: country.id, code: 'MH', name: 'Maharashtra' },
  });

  const districts = ['Pune', 'Sangli', 'Satara', 'Kolhapur', 'Solapur', 'Ahmednagar', 'Nashik', 'Chhatrapati Sambhajinagar', 'Nagpur', 'Amravati', 'Latur', 'Dharashiv', 'Beed', 'Parbhani', 'Nanded'];
  const districtMap = {};
  for (const dName of districts) {
    const code = dName.slice(0, 3).toUpperCase();
    districtMap[dName] = await prisma.district.upsert({
      where: { code },
      update: {},
      create: { regionId: region.id, code, name: dName },
    });
  }

  // 4. Users
  // DEVELOPMENT ONLY CREDENTIALS: Password is 'Dev@1234'
  console.log('Generating development password hashes... (Dev@1234)');
  const devPasswordHash = await bcrypt.hash('Dev@1234', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: devPasswordHash },
    create: { username: 'admin', fullName: 'System Administrator', email: 'admin@pashuraksha.gov.in', roleId: roles['ADMIN'].id, passwordHash: devPasswordHash },
  });
  await prisma.user.upsert({
    where: { username: 'dr_kulkarni' },
    update: { passwordHash: devPasswordHash },
    create: { username: 'dr_kulkarni', fullName: 'Dr. A. Kulkarni', email: 'vet.kulkarni@pashuraksha.gov.in', roleId: roles['VETERINARIAN'].id, passwordHash: devPasswordHash },
  });

  const farmerUser = await prisma.user.upsert({
    where: { username: 'test_farmer_a' },
    update: { passwordHash: devPasswordHash },
    create: { username: 'test_farmer_a', fullName: 'R. Deshmukh', email: 'farmer@pashuraksha.gov.in', roleId: roles['FARMER'].id, passwordHash: devPasswordHash },
  });

  // 5. Species (SP_01 to SP_16)
  const speciesData = [
    { code: "SP_01", name: "Cattle", speciesGroup: "Bovine", maharashtraRelevance: "High" },
    { code: "SP_02", name: "Buffalo", speciesGroup: "Bovine", maharashtraRelevance: "High" },
    { code: "SP_03", name: "Goat", speciesGroup: "Caprine", maharashtraRelevance: "High" },
    { code: "SP_04", name: "Sheep", speciesGroup: "Ovine", maharashtraRelevance: "High" },
    { code: "SP_05", name: "Pig", speciesGroup: "Porcine", maharashtraRelevance: "Medium" },
    { code: "SP_06", name: "Horse", speciesGroup: "Equine", maharashtraRelevance: "Medium" },
    { code: "SP_07", name: "Donkey", speciesGroup: "Equine", maharashtraRelevance: "Medium" },
    { code: "SP_08", name: "Pony", speciesGroup: "Equine", maharashtraRelevance: "Low" },
    { code: "SP_09", name: "Mule", speciesGroup: "Equine", maharashtraRelevance: "Low" },
    { code: "SP_10", name: "Camel", speciesGroup: "Camelid", maharashtraRelevance: "Low" },
    { code: "SP_11", name: "Rabbit", speciesGroup: "Lagomorph", maharashtraRelevance: "Low" },
    { code: "SP_12", name: "Chicken", speciesGroup: "Poultry", maharashtraRelevance: "High" },
    { code: "SP_13", name: "Duck", speciesGroup: "Poultry", maharashtraRelevance: "Medium" },
    { code: "SP_14", name: "Turkey", speciesGroup: "Poultry", maharashtraRelevance: "Low" },
    { code: "SP_15", name: "Quail", speciesGroup: "Poultry", maharashtraRelevance: "Low" },
    { code: "SP_16", name: "Other poultry", speciesGroup: "Poultry", maharashtraRelevance: "Low" },
  ];

  const speciesMap = {};
  for (const s of speciesData) {
    speciesMap[s.code] = await prisma.species.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log('✔ 16 Species seeded.');

  // 6. Breeds (BR_01 to BR_20)
  const breedsData = [
    { speciesCode: "SP_01", name: "Khillar" },
    { speciesCode: "SP_01", name: "Deoni" },
    { speciesCode: "SP_01", name: "Dangi" },
    { speciesCode: "SP_01", name: "Red Kandhari" },
    { speciesCode: "SP_01", name: "Gaolao" },
    { speciesCode: "SP_01", name: "Kathani" },
    { speciesCode: "SP_01", name: "Konkan Kapila" },
    { speciesCode: "SP_01", name: "Umarda" },
    { speciesCode: "SP_02", name: "Pandharpuri" },
    { speciesCode: "SP_02", name: "Nagpuri" },
    { speciesCode: "SP_02", name: "Marathwadi" },
    { speciesCode: "SP_02", name: "Purnathadi" },
    { speciesCode: "SP_02", name: "Melghati" },
    { speciesCode: "SP_03", name: "Osmanabadi" },
    { speciesCode: "SP_03", name: "Sangamneri" },
    { speciesCode: "SP_03", name: "Berari" },
    { speciesCode: "SP_03", name: "Konkan Kanyal" },
    { speciesCode: "SP_04", name: "Madgyal" },
    { speciesCode: "SP_04", name: "Deccani" },
    { speciesCode: "SP_06", name: "Bhimthadi" },
  ];

  const breedMap = {};
  for (const b of breedsData) {
    const sp = speciesMap[b.speciesCode];
    if (sp) {
      breedMap[b.name] = await prisma.breed.create({
        data: {
          speciesId: sp.id,
          name: b.name,
          originRegion: 'Maharashtra',
        },
      });
    }
  }
  console.log('✔ 20 Priority Breeds seeded.');

  // 7. Diseases (DIS_01 to DIS_16)
  const diseasesData = [
    { code: "DIS_01", name: "Foot and Mouth Disease", shortName: "FMD", isNotifiable: true, isZoonotic: false },
    { code: "DIS_02", name: "Hemorrhagic Septicemia", shortName: "HS", isNotifiable: true, isZoonotic: false },
    { code: "DIS_03", name: "Lumpy Skin Disease", shortName: "LSD", isNotifiable: true, isZoonotic: false },
    { code: "DIS_04", name: "Brucellosis", shortName: "BRU", isNotifiable: true, isZoonotic: true },
    { code: "DIS_05", name: "Leptospirosis", shortName: "LEP", isNotifiable: false, isZoonotic: true },
    { code: "DIS_06", name: "Peste des Petits Ruminants", shortName: "PPR", isNotifiable: true, isZoonotic: false },
    { code: "DIS_07", name: "Glanders", shortName: "GLA", isNotifiable: true, isZoonotic: true },
    { code: "DIS_08", name: "African Swine Fever", shortName: "ASF", isNotifiable: true, isZoonotic: false },
    { code: "DIS_09", name: "Anthrax", shortName: "ANT", isNotifiable: true, isZoonotic: true },
    { code: "DIS_10", name: "Black Quarter", shortName: "BQ", isNotifiable: true, isZoonotic: false },
    { code: "DIS_11", name: "Rabies", shortName: "RAB", isNotifiable: true, isZoonotic: true },
    { code: "DIS_12", "name": "Avian Influenza", shortName: "AI", isNotifiable: true, isZoonotic: true },
    { code: "DIS_13", name: "Surra (Trypanosomiasis)", shortName: "SUR", isNotifiable: false, isZoonotic: false },
    { code: "DIS_14", name: "Theileriosis", shortName: "THE", isNotifiable: false, isZoonotic: false },
    { code: "DIS_15", name: "Enterotoxemia", shortName: "ET", isNotifiable: false, isZoonotic: false },
    { code: "DIS_16", name: "Bovine Mastitis", shortName: "MAS", isNotifiable: false, isZoonotic: false },
  ];

  const diseaseMap = {};
  for (const d of diseasesData) {
    diseaseMap[d.code] = await prisma.disease.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }
  console.log('✔ 16 Diseases seeded.');

  // 8. Farms & Animals
  const defaultDistrict = districtMap['Pune'] || Object.values(districtMap)[0];
  const farm1 = await prisma.farm.upsert({
    where: { code: 'FARM-PN-001' },
    update: {},
    create: {
      code: 'FARM-PN-001',
      name: 'Deshmukh Dairy & Cattle Farm',
      districtId: defaultDistrict.id,
      tenantId: tenant.id,
      ownerId: farmerUser.id,
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'Haveli Taluka, Pune, Maharashtra',
    },
  });

  const cattleSp = speciesMap['SP_01'];
  const khillarBreed = breedMap['Khillar'];

  await prisma.animal.upsert({
    where: { tagId: 'MH-CAT-027' },
    update: {},
    create: {
      tagId: 'MH-CAT-027',
      speciesId: cattleSp.id,
      breedId: khillarBreed ? khillarBreed.id : null,
      farmId: farm1.id,
      gender: 'FEMALE',
      ageMonths: 36,
      healthStatus: 'WATCH',
      riskLevel: 'YELLOW',
    },
  });

  console.log('✔ Sample Farm & Animal (MH-CAT-027) seeded.');
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
