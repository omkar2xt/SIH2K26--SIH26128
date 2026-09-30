const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const farmer = await prisma.user.findFirst({ where: { username: 'test_farmer_a' } });
  const farm = await prisma.farm.findFirst({ where: { ownerId: farmer.id } });
  console.log('Farm:', farm.id);
  
  const animals = await prisma.animal.findMany({ where: { farmId: farm.id } });
  console.log('Animals in farm:', animals.length);
}
run().catch(console.error).finally(() => prisma.$disconnect());
