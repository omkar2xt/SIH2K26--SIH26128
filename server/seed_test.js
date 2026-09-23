const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Get farmer role
  const role = await prisma.role.findUnique({ where: { name: 'FARMER' } });
  
  // Create Farmer A
  const farmerA = await prisma.user.upsert({
    where: { username: 'test_farmer_a' },
    update: { passwordHash },
    create: { username: 'test_farmer_a', fullName: 'Farmer A', email: 'a@test.com', roleId: role.id, passwordHash }
  });
  
  // Create Farmer B
  const farmerB = await prisma.user.upsert({
    where: { username: 'test_farmer_b' },
    update: { passwordHash },
    create: { username: 'test_farmer_b', fullName: 'Farmer B', email: 'b@test.com', roleId: role.id, passwordHash }
  });
  
  // Get district
  const district = await prisma.district.findFirst();
  
  // Create Farm A
  const farmA = await prisma.farm.upsert({
    where: { code: 'FARM-A' },
    update: {},
    create: { code: 'FARM-A', name: 'Farm A', ownerId: farmerA.id, districtId: district.id, latitude: 18, longitude: 73 }
  });
  
  // Create Animal A
  const species = await prisma.species.findFirst();
  const animalA = await prisma.animal.upsert({
    where: { tagId: 'TAG-A' },
    update: {},
    create: { tagId: 'TAG-A', speciesId: species.id, farmId: farmA.id }
  });
  
  // Create Disease Species Assoc
  const disease = await prisma.disease.findFirst({ where: { code: 'DIS_01' }});
  if (disease) {
      await prisma.diseaseSpeciesAssociation.upsert({
          where: { recordCode: 'TEST_REC' },
          update: {},
          create: { recordCode: 'TEST_REC', diseaseId: disease.id, speciesId: species.id }
      });
  }

  console.log('Test data seeded.');
}
seed().catch(console.error).finally(() => prisma.$disconnect());
