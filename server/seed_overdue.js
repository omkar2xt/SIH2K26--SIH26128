const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const farmer = await prisma.user.findUnique({ where: { username: 'test_farmer_a' }});
  const farm = await prisma.farm.findFirst({ where: { ownerId: farmer.id }});
  const animals = await prisma.animal.findMany({ where: { farmId: farm.id }, take: 2 });
  
  const records = animals.map(a => ({
    animalId: a.id,
    vaccineName: 'PPR-Vac',
    administeredAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    nextDueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    batchNumber: 'PPR-OLD-99',
    administeredBy: 'Dr. Kulkarni'
  }));
  
  await prisma.vaccinationRecord.createMany({ data: records });
  console.log('Inserted ' + records.length + ' OVERDUE vaccination records');
}
main().catch(console.error).finally(() => prisma.$disconnect());
