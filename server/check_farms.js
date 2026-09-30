const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const farmer = await prisma.user.findFirst({ where: { username: 'test_farmer_a' } });
  console.log('Farmer ID:', farmer.id);
  const farms = await prisma.farm.findMany({ where: { ownerId: farmer.id } });
  for (let f of farms) {
    const anms = await prisma.animal.count({ where: { farmId: f.id } });
    console.log(`Farm ${f.id} has ${anms} animals`);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
