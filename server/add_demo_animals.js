const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const farmer = await prisma.user.findFirst({ where: { username: 'test_farmer_a' } });
  const farm = await prisma.farm.findFirst({ where: { ownerId: farmer.id } });
  
  if (!farm) {
    console.error('No farm found for farmer');
    return;
  }

  // Get species (Cattle)
  const species = await prisma.species.findFirst({ where: { name: 'Cattle' } });
  const breed = await prisma.breed.findFirst({ where: { speciesId: species.id } });

  console.log('Adding 15 animals to farm:', farm.id);

  let tagCounter = 100;
  const generateTag = () => 'MH-CAT-' + (tagCounter++);

  // 7 Normal (HEALTHY, GREEN)
  for (let i=0; i<7; i++) {
    await prisma.animal.create({
      data: {
        tagId: generateTag(),
        speciesId: species.id,
        breedId: breed.id,
        farmId: farm.id,
        gender: 'FEMALE',
        ageMonths: 24,
        healthStatus: 'HEALTHY',
        riskLevel: 'GREEN'
      }
    });
  }

  // 3 Medium (WATCH, YELLOW)
  for (let i=0; i<3; i++) {
    await prisma.animal.create({
      data: {
        tagId: generateTag(),
        speciesId: species.id,
        breedId: breed.id,
        farmId: farm.id,
        gender: 'FEMALE',
        ageMonths: 18,
        healthStatus: 'WATCH',
        riskLevel: 'YELLOW'
      }
    });
  }

  // 5 Critical (SICK, RED)
  for (let i=0; i<5; i++) {
    await prisma.animal.create({
      data: {
        tagId: generateTag(),
        speciesId: species.id,
        breedId: breed.id,
        farmId: farm.id,
        gender: 'MALE',
        ageMonths: 36,
        healthStatus: 'SICK',
        riskLevel: 'RED'
      }
    });
  }

  console.log('Done adding animals!');
}
run().catch(console.error).finally(() => prisma.$disconnect());
