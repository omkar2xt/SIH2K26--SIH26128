const http = require('http');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

function request(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- PREPARING TEST DATA ---');
  let testState = {};
  
  try {
    // 1. Get roles
    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const vetRole = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
    const district = await prisma.district.findFirst();
    const species = await prisma.species.findFirst();

    // 2. Create Farmer A & B
    const farmerA = await prisma.user.create({
      data: { username: 'test_farmer_a', fullName: 'Farmer A', roleId: farmerRole.id, email: 'a@test.com' }
    });
    const farmerB = await prisma.user.create({
      data: { username: 'test_farmer_b', fullName: 'Farmer B', roleId: farmerRole.id, email: 'b@test.com' }
    });
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const vet = await prisma.user.findUnique({ where: { username: 'dr_kulkarni' } });

    // 3. Create Farms
    const farmA = await prisma.farm.create({
      data: { code: 'FARM-TEST-A', name: 'Farm A', districtId: district.id, ownerId: farmerA.id, latitude: 0, longitude: 0 }
    });
    const farmB = await prisma.farm.create({
      data: { code: 'FARM-TEST-B', name: 'Farm B', districtId: district.id, ownerId: farmerB.id, latitude: 0, longitude: 0 }
    });

    // 4. Create Animals
    const animalA = await prisma.animal.create({
      data: { tagId: 'TEST-TAG-A', speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 12, riskLevel: 'GREEN' }
    });
    const animalB = await prisma.animal.create({
      data: { tagId: 'TEST-TAG-B', speciesId: species.id, farmId: farmB.id, gender: 'FEMALE', ageMonths: 12, riskLevel: 'GREEN' }
    });

    // 5. Create Case
    const caseB = await prisma.case.create({
      data: { caseNumber: 'TEST-CASE-B', animalId: animalB.id, farmId: farmB.id }
    });

    testState = { farmerA, farmerB, farmA, farmB, animalA, animalB, caseB, species };

    // Generate Tokens
    const makeToken = (user, roleName) => jwt.sign({ userId: user.id, username: user.username, roleId: user.roleId, role: roleName }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const tokenFA = makeToken(farmerA, 'FARMER');
    const tokenFB = makeToken(farmerB, 'FARMER');
    const tokenAdmin = makeToken(admin, 'ADMIN');
    const tokenVet = makeToken(vet, 'VETERINARIAN');

    console.log('--- STARTING AUTHORIZATION TEST MATRIX ---\n');
    let passed = 0;
    let failed = 0;

    function assertCondition(name, res, conditionFn, expectedStatus = null) {
      const okStatus = expectedStatus ? res.statusCode === expectedStatus : true;
      const okCond = conditionFn(res);
      if (okStatus && okCond) {
        console.log(`[PASS] ${name}`);
        passed++;
        return true;
      } else {
        console.log(`[FAIL] ${name} - Status: ${res.statusCode} | Data: ${JSON.stringify(res.data)}`);
        failed++;
        return false;
      }
    }

    // 1. Farmer A -> own animal -> PASS
    let res = await request('GET', `/animals/${animalA.id}`, tokenFA);
    assertCondition('1. Farmer A -> own animal -> PASS', res, r => r.data && r.data.id === animalA.id, 200);

    // 2. Farmer A -> Farmer B animal -> DENY
    res = await request('GET', `/animals/${animalB.id}`, tokenFA);
    assertCondition('2. Farmer A -> Farmer B animal -> DENY', res, r => true, 404);

    // 3. Farmer A -> Farmer B farm -> DENY (via farms list)
    res = await request('GET', '/farms', tokenFA);
    if (!Array.isArray(res.data)) console.log('DEBUG /farms res.data:', res.data);
    assertCondition('3. Farmer A -> Farmer B farm -> DENY', res, r => r.data && Array.isArray(r.data) && !r.data.find(f => f.id === farmB.id), 200);

    // 4. Farmer A -> Farmer B case -> DENY
    res = await request('GET', '/cases', tokenFA);
    assertCondition('4. Farmer A -> Farmer B case -> DENY', res, r => r.data && !r.data.find(c => c.id === caseB.id), 200);

    // 5. Vet -> unassigned case -> DENY (vet list should be empty for new cases)
    res = await request('GET', '/cases', tokenVet);
    assertCondition('5. Vet -> unassigned case -> DENY', res, r => r.data && !r.data.find(c => c.id === caseB.id), 200);

    // 6. Normal user -> admin endpoint -> DENY
    res = await request('GET', '/users', tokenFA);
    assertCondition('6. Normal user -> admin endpoint -> DENY', res, r => true, 403);

    // 7. Admin -> admin endpoint -> PASS
    res = await request('GET', '/users', tokenAdmin);
    assertCondition('7. Admin -> admin endpoint -> PASS', res, r => r.data && Array.isArray(r.data), 200);

    // 8. Mass Assignment: role injection -> REJECTED (via body)
    // Create animal and inject riskLevel
    res = await request('POST', '/animals', tokenFA, {
      tagId: 'TEST-TAG-NEW',
      speciesId: species.id,
      farmId: farmA.id,
      gender: 'MALE',
      ageMonths: 5,
      riskLevel: 'CRITICAL', // MUST BE REJECTED BY ZOD STRICT SCHEMA
      role: 'ADMIN'          // MUST BE REJECTED
    });
    assertCondition('8. Mass assignment: riskLevel injection -> REJECTED', res, r => true, 400);
    const newAnimalId = res.data?.id;

    // 9. Mass Assignment: farm owner override -> DENY
    res = await request('POST', '/animals', tokenFA, {
      tagId: 'TEST-TAG-B-NEW',
      speciesId: species.id,
      farmId: farmB.id, // Farmer A trying to create animal on Farm B
      gender: 'FEMALE',
      ageMonths: 5,
    });
    assertCondition('9. Mass assignment: farm owner override -> DENY', res, r => true, 403);

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);

    // Cleanup
    if (newAnimalId) await prisma.animal.delete({ where: { id: newAnimalId } });

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    console.log('--- CLEANING UP TEST DATA ---');
    if (testState.caseB) await prisma.case.delete({ where: { id: testState.caseB.id } });
    if (testState.animalB) await prisma.animal.delete({ where: { id: testState.animalB.id } });
    if (testState.animalA) await prisma.animal.delete({ where: { id: testState.animalA.id } });
    if (testState.farmB) await prisma.farm.delete({ where: { id: testState.farmB.id } });
    if (testState.farmA) await prisma.farm.delete({ where: { id: testState.farmA.id } });
    if (testState.farmerB) await prisma.user.delete({ where: { id: testState.farmerB.id } });
    if (testState.farmerA) await prisma.user.delete({ where: { id: testState.farmerA.id } });
    await prisma.$disconnect();
  }
}

runTests();
