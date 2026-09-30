const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  const roleMap = {};
  roles.forEach(r => roleMap[r.name] = r.id);

  const accounts = [
    { username: 'admin', fullName: 'System Administrator', email: 'admin@pashuraksha.gov.in', role: 'ADMIN', pass: 'mX9$pQ2#rN7@vL4^' },
    { username: 'dr_kulkarni', fullName: 'Dr. Anand Kulkarni', email: 'dr.kulkarni@pashuraksha.gov.in', role: 'VETERINARIAN', pass: 'tF3%kY8*wV1!zC6&' },
    { username: 'test_farmer_a', fullName: 'R. Deshmukh', email: 'farmer.deshmukh@pashuraksha.gov.in', role: 'FARMER', pass: 'hB5^nJ2$mD9@fX3*' },
    { username: 'test_farmer_b', fullName: 'S. Patil', email: 'farmer.patil@pashuraksha.gov.in', role: 'FARMER', pass: 'hB5^nJ2$mD9@fX3*' },
    { username: 'lab_tech_1', fullName: 'Laboratory Officer', email: 'lab.officer@pashuraksha.gov.in', role: 'ADMIN', pass: 'qR8#vK4%pM7&gN2@' },
    { username: 'district_official', fullName: 'District Veterinary Officer', email: 'dist.vet.officer@pashuraksha.gov.in', role: 'DISTRICT_OFFICIAL', pass: 'dO4$mK8#vL2@qW9*' },
    { username: 'state_official', fullName: 'State Directorate Officer', email: 'state.officer@pashuraksha.gov.in', role: 'STATE_OFFICIAL', pass: 'sO5*mN2#vK9@rL3^' },
    { username: 'field_worker_1', fullName: 'Pashu Sakhi Worker', email: 'field.worker@pashuraksha.gov.in', role: 'FIELD_WORKER', pass: 'fW3^pK7$mD1@vX8*' }
  ];

  for (const acc of accounts) {
    const roleId = roleMap[acc.role];
    if (!roleId) {
      console.log(`Role ${acc.role} not found, skipping ${acc.username}`);
      continue;
    }
    const hash = await bcrypt.hash(acc.pass, 10);
    const existing = await prisma.user.findUnique({ where: { username: acc.username } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: hash, roleId, fullName: acc.fullName }
      });
      console.log(`[UPDATED] ${acc.username} (${acc.role})`);
    } else {
      await prisma.user.create({
        data: {
          username: acc.username,
          fullName: acc.fullName,
          email: acc.email,
          roleId,
          passwordHash: hash
        }
      });
      console.log(`[CREATED] ${acc.username} (${acc.role})`);
    }
  }

  await prisma.$disconnect();
  console.log('All demo accounts seeded successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
