const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({ where: { username: 'test_farmer_a' } });
  if (!user) { console.log('User not found'); return; }
  
  const isValid = await bcrypt.compare('hB5^nJ2$mD9@fX3*', user.passwordHash);
  console.log('Password hash match?', isValid);
  
  const isValidDev = await bcrypt.compare('Dev@1234', user.passwordHash);
  console.log('Old Password hash match (Dev@1234)?', isValidDev);
}
run().catch(console.error).finally(() => prisma.$disconnect());
