const http = require('http');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const TS = Date.now();

function request(method, path, token, body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost', port: PORT, path: `/api${path}`, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null }));
    });
    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function makeToken(user, roleName, expiresIn = '1h') {
  return jwt.sign(
    { userId: user.id, username: user.username, roleId: user.roleId, role: roleName },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

async function runTests() {
  const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
  const vetRole = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
  const species = await prisma.species.findFirst();

  const pwd = 'hashedpassword123';
  const farmerA = await prisma.user.create({ data: { username: `sy_fa_${TS}`, fullName: 'Farmer A', roleId: farmerRole.id, email: `sya_${TS}@t.com`, passwordHash: pwd } });
  const farmerB = await prisma.user.create({ data: { username: `sy_fb_${TS}`, fullName: 'Farmer B', roleId: farmerRole.id, email: `syb_${TS}@t.com`, passwordHash: pwd } });
  
  const tokenA = makeToken(farmerA, 'FARMER');
  
  const district = await prisma.district.findFirst();
  const farmA = await prisma.farm.create({ data: { code: `SFA_${TS}`, name: 'Farm A', districtId: district.id, ownerId: farmerA.id, latitude: 19.0, longitude: 75.0 } });
  const farmB = await prisma.farm.create({ data: { code: `SFB_${TS}`, name: 'Farm B', districtId: district.id, ownerId: farmerB.id, latitude: 19.1, longitude: 75.1 } });

  const animalA = await prisma.animal.create({ data: { tagId: `STA_${TS}`, speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 24, riskLevel: 'GREEN' } });
  const animalB = await prisma.animal.create({ data: { tagId: `STB_${TS}`, speciesId: species.id, farmId: farmB.id, gender: 'FEMALE', ageMonths: 24, riskLevel: 'GREEN' } });

  console.log("=== Edge Case E: duplicate localOperationId (Idempotency) ===");
  const opId = crypto.randomUUID();
  const syncPayload = { operations: [{ id: opId, entityName: 'observation', actionType: 'CREATE', payload: { animalId: animalA.id, activityLevel: 5 } }] };
  const sync1 = await request('POST', '/sync', tokenA, syncPayload);
  const sync2 = await request('POST', '/sync', tokenA, syncPayload);
  console.log("Idempotent Return:", sync2.data?.syncResults?.[0]?.status === 'SYNCED' && sync2.data.syncResults[0].message === 'Already processed' ? "PASS" : "FAIL");

  console.log("\n=== Edge Case A: Farmer A -> Farmer B animal ===");
  const opId2 = crypto.randomUUID();
  const badSyncPayload = { operations: [{ id: opId2, entityName: 'observation', actionType: 'CREATE', payload: { animalId: animalB.id, activityLevel: 5 } }] };
  const syncBad = await request('POST', '/sync', tokenA, badSyncPayload);
  console.log("Cross-farm sync rejected:", syncBad.data?.syncResults?.[0]?.status === 'FAILED' ? "PASS" : "FAIL");

  console.log("\n=== Edge Case B: Invalid JWT ===");
  const invalidSync = await request('POST', '/sync', 'invalid.jwt.token', syncPayload);
  console.log("Invalid JWT rejected:", invalidSync.status === 401 || invalidSync.status === 403 ? "PASS" : "FAIL");

  console.log("\n=== Edge Case C: Expired JWT ===");
  const tokenExpired = makeToken(farmerA, 'FARMER', '-1h');
  const expiredSync = await request('POST', '/sync', tokenExpired, syncPayload);
  console.log("Expired JWT rejected:", expiredSync.status === 401 || expiredSync.status === 403 ? "PASS" : "FAIL");

  console.log("\n=== Edge Case D: Malformed queued operation ===");
  const opId3 = crypto.randomUUID();
  const malformedPayload = { operations: [{ id: opId3, entityName: 'observation', actionType: 'CREATE', payload: { activityLevel: 5 } }] }; // Missing animalId
  const syncMalformed = await request('POST', '/sync', tokenA, malformedPayload);
  console.log("Malformed payload rejected:", syncMalformed.data?.syncResults?.[0]?.status === 'FAILED' ? "PASS" : "FAIL");

  console.log("\n=== Edge Case G: One bad + one valid in same batch ===");
  const opId4 = crypto.randomUUID();
  const opId5 = crypto.randomUUID();
  const mixedPayload = {
    operations: [
      { id: opId4, entityName: 'observation', actionType: 'CREATE', payload: { activityLevel: 5 } }, // bad
      { id: opId5, entityName: 'observation', actionType: 'CREATE', payload: { animalId: animalA.id, activityLevel: 8 } } // valid
    ]
  };
  const syncMixed = await request('POST', '/sync', tokenA, mixedPayload);
  const badRes = syncMixed.data?.syncResults?.find(r => r.clientRef === opId4);
  const validRes = syncMixed.data?.syncResults?.find(r => r.clientRef === opId5);
  console.log("Batch processed correctly (bad=FAILED, valid=SYNCED):", badRes?.status === 'FAILED' && validRes?.status === 'SYNCED' ? "PASS" : "FAIL");

  console.log("\n=== Edge Case H: Malicious injection (tenantId/ownerId/riskLevel) ===");
  const opId6 = crypto.randomUUID();
  const massAssignPayload = {
    operations: [{
      id: opId6, entityName: 'observation', actionType: 'CREATE',
      payload: { animalId: animalA.id, activityLevel: 5, tenantId: 'hacked123', ownerId: 'hacked456', riskLevel: 'CRITICAL' }
    }]
  };
  await request('POST', '/sync', tokenA, massAssignPayload);
  const dbObs = await prisma.healthObservation.findFirst({ where: { animalId: animalA.id }, orderBy: { createdAt: 'desc' } });
  console.log("Observer ID is untouched:", dbObs?.observerId === farmerA.id ? "PASS" : "FAIL");
  console.log("riskLevel injection dropped:", dbObs?.riskLevel !== 'CRITICAL' ? "PASS" : "FAIL");

  // Cleanup
  await prisma.syncQueue.deleteMany({ where: { clientRef: { in: [opId, opId2, opId3, opId4, opId5, opId6] } } });
  await prisma.healthObservation.deleteMany({ where: { animalId: { in: [animalA.id, animalB.id] } } });
  await prisma.animal.deleteMany({ where: { id: { in: [animalA.id, animalB.id] } } });
  await prisma.farm.deleteMany({ where: { id: { in: [farmA.id, farmB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [farmerA.id, farmerB.id] } } });
  await prisma.$disconnect();
}
runTests();
