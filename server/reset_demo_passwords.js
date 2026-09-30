const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

const DEMO_CREDENTIALS = [
  { username: "admin",         password: "mX9$pQ2#rN7@vL4^" },
  { username: "dr_kulkarni",   password: "tF3%kY8*wV1!zC6&" },
  { username: "test_farmer_a", password: "hB5^nJ2$mD9@fX3*" },
  { username: "test_farmer_b", password: "hB5^nJ2$mD9@fX3*" },
  { username: "lab_tech_1",    password: "qR8#vK4%pM7&gN2@" },
];

async function resetPasswords() {
  for (const cred of DEMO_CREDENTIALS) {
    const hash = await bcrypt.hash(cred.password, 10);
    try {
      await prisma.user.update({ where: { username: cred.username }, data: { passwordHash: hash } });
      const user = await prisma.user.findUnique({ where: { username: cred.username }, select: { passwordHash: true } });
      const valid = await bcrypt.compare(cred.password, user.passwordHash);
      console.log((valid ? "[OK]" : "[FAIL]") + " " + cred.username);
    } catch (e) {
      console.log("[SKIP] " + cred.username + " - " + e.message);
    }
  }
  await prisma.$disconnect();
  process.exit(0);
}

resetPasswords().catch(e => { console.error(e); process.exit(1); });
