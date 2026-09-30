const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const farmer = await prisma.user.findUnique({ where: { username: 'test_farmer_a' }});
  const farm = await prisma.farm.findFirst({ where: { ownerId: farmer.id }});
  const animals = await prisma.animal.findMany({ where: { farmId: farm.id }});
  
  const records = [];
  let i = 0;
  for (const animal of animals) {
    if (i % 2 === 0) {
      records.push({
        animalId: animal.id,
        vaccineName: 'FMD Bivalent',
        administeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000),
        batchNumber: 'FMD-2026-B1',
        administeredBy: 'Dr. Sharma'
      });
    }
    if (i % 3 === 0) {
      records.push({
        animalId: animal.id,
        vaccineName: 'LSD-Vac Live',
        administeredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
        batchNumber: 'LSD-2026-X9',
        administeredBy: 'Dr. Sharma'
      });
    }
    i++;
  }
  
  await prisma.vaccinationRecord.createMany({ data: records });
  console.log('Inserted ' + records.length + ' vaccination records');
}
main().catch(console.error).finally(() => prisma.$disconnect());
