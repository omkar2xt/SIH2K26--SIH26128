const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    }, res => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(result) }); }
        catch(e) { resolve({ status: res.statusCode, body: result }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log("=== PREPARING TEST DATA ===");
  const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
  const devPasswordHash = await bcrypt.hash('Dev@1234', 10);
  
  // Create Farmer A and Farmer B
  const farmerA = await prisma.user.upsert({
    where: { username: 'test_farmer_a' },
    update: { passwordHash: devPasswordHash },
    create: { username: 'test_farmer_a', email: 'a@a.com', fullName: 'Farmer A', roleId: farmerRole.id, passwordHash: devPasswordHash }
  });
  const farmerB = await prisma.user.upsert({
    where: { username: 'test_farmer_b' },
    update: { passwordHash: devPasswordHash },
    create: { username: 'test_farmer_b', email: 'b@b.com', fullName: 'Farmer B', roleId: farmerRole.id, passwordHash: devPasswordHash }
  });

  const district = await prisma.district.findFirst();
  const farmA = await prisma.farm.upsert({
    where: { code: 'FARM-A' },
    update: { ownerId: farmerA.id },
    create: { code: 'FARM-A', name: 'Farm A', latitude: 0, longitude: 0, tenantId: (await prisma.tenant.findFirst()).id, districtId: district.id, ownerId: farmerA.id }
  });
  const farmB = await prisma.farm.upsert({
    where: { code: 'FARM-B' },
    update: { ownerId: farmerB.id },
    create: { code: 'FARM-B', name: 'Farm B', latitude: 0, longitude: 0, tenantId: (await prisma.tenant.findFirst()).id, districtId: district.id, ownerId: farmerB.id }
  });
  
  // Create Animals
  const species = await prisma.species.findFirst();
  const animalA = await prisma.animal.upsert({
    where: { tagId: 'TAG-A' },
    update: { farmId: farmA.id },
    create: { tagId: 'TAG-A', speciesId: species.id, farmId: farmA.id, gender: 'FEMALE' }
  });
  const animalB = await prisma.animal.upsert({
    where: { tagId: 'TAG-B' },
    update: { farmId: farmB.id },
    create: { tagId: 'TAG-B', speciesId: species.id, farmId: farmB.id, gender: 'FEMALE' }
  });

  console.log("\n=== 3. LOGIN VERIFICATION ===");
  const loginRes = await request('POST', '/api/auth/login', { username: 'test_farmer_a', password: 'Dev@1234' });
  console.log("Valid login status:", loginRes.status);
  console.log("Valid login body:", loginRes.body);
  console.log("JWT present:", !!(loginRes.body.data?.token || loginRes.body.token));
  const tokenA = loginRes.body.data?.token || loginRes.body.token;

  const invalidRes = await request('POST', '/api/auth/login', { username: 'test_farmer_a', password: 'WrongPassword' });
  console.log("Invalid password status:", invalidRes.status);

  console.log("\n=== 4. FARM VERIFICATION ===");
  const farmsRes = await request('GET', '/api/farms', null, tokenA);
  console.log("Farms status:", farmsRes.status);
  console.log("Farms array length:", farmsRes.body?.length);
  if (farmsRes.body?.length > 0) {
      console.log("Sample farm:", farmsRes.body[0].name, "| ID:", farmsRes.body[0].id);
  }

  console.log("\n=== 5. ANIMAL VERIFICATION ===");
  const animalsRes = await request('GET', '/api/animals', null, tokenA);
  console.log("Animals status:", animalsRes.status);
  console.log("Animals count (Farmer A should only see Farm A's animals):", animalsRes.body?.length);
  
  console.log("Attempt Farmer A accessing Animal A (own):");
  const animalARes = await request('GET', `/api/animals/${animalA.id}`, null, tokenA);
  console.log(`Status:`, animalARes.status);

  console.log("Attempt Farmer A accessing Animal B (other):");
  const animalBRes = await request('GET', `/api/animals/${animalB.id}`, null, tokenA);
  console.log(`Status:`, animalBRes.status);

  console.log("\n=== 6. OBSERVATION VERIFICATION & MASS ASSIGNMENT ===");
  const obsReq = {
    animalId: animalA.id,
    notes: "Symptoms: Limping\nNotes: Verification test",
    severity: "Moderate",
    cameraSource: false,
    iotSource: false,
    ownerId: "HACKER",
    riskLevel: "CRITICAL",
    riskScore: 100
  };
  const obsRes = await request('POST', '/api/observations', obsReq, tokenA);
  console.log("Observation status with injected payload:", obsRes.status);
  console.log("Observation error body:", obsRes.body);

  const cleanObsReq = {
    animalId: animalA.id,
    notes: "Symptoms: Limping\nNotes: Verification test",
    severity: "Moderate",
    cameraSource: false,
    iotSource: false
  };
  const cleanObsRes = await request('POST', '/api/observations', cleanObsReq, tokenA);
  console.log("Clean observation status:", cleanObsRes.status);
  console.log("Observation created ID:", cleanObsRes.body?.id);
}

run().catch(console.error).finally(() => prisma.$disconnect());
