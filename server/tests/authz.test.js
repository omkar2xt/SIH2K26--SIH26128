/**
 * PASHU-RAKSHA — Authorization Test Matrix
 * Tests resource-based authorization (not just role-based).
 * Includes Step 2H case authorization tests.
 *
 * FIX (2H): All fixture identifiers now use a timestamp suffix to prevent
 * unique-constraint failures on repeated runs.
 */
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
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- PREPARING TEST DATA ---');
  let testState = {};
  const TS = Date.now(); // unique suffix to prevent constraint violations on repeated runs

  try {
    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const adminRole  = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const vetRole    = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
    const district   = await prisma.district.findFirst();
    const species    = await prisma.species.findFirst();

    const farmerA = await prisma.user.create({
      data: { username: `test_farmer_a_${TS}`, fullName: 'Farmer A', roleId: farmerRole.id, email: `a_${TS}@test.com` }
    });
    const farmerB = await prisma.user.create({
      data: { username: `test_farmer_b_${TS}`, fullName: 'Farmer B', roleId: farmerRole.id, email: `b_${TS}@test.com` }
    });
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const vet   = await prisma.user.findUnique({ where: { username: 'dr_kulkarni' } });

    const farmA = await prisma.farm.create({
      data: { code: `FARM-TEST-A-${TS}`, name: 'Farm A', districtId: district.id, ownerId: farmerA.id, latitude: 0, longitude: 0 }
    });
    const farmB = await prisma.farm.create({
      data: { code: `FARM-TEST-B-${TS}`, name: 'Farm B', districtId: district.id, ownerId: farmerB.id, latitude: 0, longitude: 0 }
    });

    const animalA = await prisma.animal.create({
      data: { tagId: `TEST-TAG-A-${TS}`, speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 12 }
    });
    const animalB = await prisma.animal.create({
      data: { tagId: `TEST-TAG-B-${TS}`, speciesId: species.id, farmId: farmB.id, gender: 'FEMALE', ageMonths: 12 }
    });

    const caseB = await prisma.case.create({
      data: { caseNumber: `TEST-CASE-B-${TS}`, animalId: animalB.id, farmId: farmB.id }
    });

    testState = { farmerA, farmerB, farmA, farmB, animalA, animalB, caseB, species };

    const makeToken = (user, roleName) => jwt.sign(
      { userId: user.id, username: user.username, roleId: user.roleId, role: roleName },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const tokenFA    = makeToken(farmerA, 'FARMER');
    const tokenFB    = makeToken(farmerB, 'FARMER');
    const tokenAdmin = makeToken(admin,   'ADMIN');
    const tokenVet   = makeToken(vet,     'VETERINARIAN');

    console.log('--- STARTING AUTHORIZATION TEST MATRIX ---\n');
    let passed = 0;
    let failed = 0;

    function assertCondition(name, res, conditionFn, expectedStatus = null) {
      const okStatus = expectedStatus ? res.statusCode === expectedStatus : true;
      const okCond   = conditionFn(res);
      if (okStatus && okCond) {
        console.log(`[PASS] ${name}`);
        passed++;
        return true;
      } else {
        console.log(`[FAIL] ${name} - Status: ${res.statusCode} | Data: ${JSON.stringify(res.data)?.slice(0, 200)}`);
        failed++;
        return false;
      }
    }

    // ── Group 1: Animal Resource Authorization ─────────────────────────────────

    let res = await request('GET', `/animals/${animalA.id}`, tokenFA);
    assertCondition('1. Farmer A -> own animal -> PASS', res, r => r.data && r.data.id === animalA.id, 200);

    res = await request('GET', `/animals/${animalB.id}`, tokenFA);
    assertCondition('2. Farmer A -> Farmer B animal -> DENY', res, r => true, 404);

    res = await request('GET', '/farms', tokenFA);
    assertCondition('3. Farmer A farms list -> no Farm B', res,
      r => r.data && Array.isArray(r.data) && !r.data.find(f => f.id === farmB.id), 200);

    // ── Group 2: Case Resource Authorization ───────────────────────────────────

    res = await request('GET', '/cases', tokenFA);
    assertCondition('4. Farmer A GET /cases -> no Farm B case', res,
      r => r.data && !r.data.find(c => c.id === caseB.id), 200);

    res = await request('GET', `/cases/${caseB.id}`, tokenFA);
    assertCondition('4b. Farmer A GET /cases/:id (Farm B case) -> 404', res, r => true, 404);

    res = await request('GET', '/cases', tokenVet);
    assertCondition('5. Vet -> unassigned case -> not visible', res,
      r => r.data && !r.data.find(c => c.id === caseB.id), 200);

    // ── Group 3: Role Authorization ────────────────────────────────────────────

    res = await request('GET', '/users', tokenFA);
    assertCondition('6. Normal user -> admin endpoint -> DENY', res, r => true, 403);

    res = await request('GET', '/users', tokenAdmin);
    assertCondition('7. Admin -> admin endpoint -> PASS', res, r => r.data && Array.isArray(r.data), 200);

    // ── Group 4: Mass Assignment ───────────────────────────────────────────────

    res = await request('POST', '/animals', tokenFA, {
      tagId: `TEST-TAG-NEW-${TS}`,
      speciesId: species.id,
      farmId: farmA.id,
      gender: 'MALE',
      ageMonths: 5,
      riskLevel: 'CRITICAL', // must be rejected by Zod strict schema
      role: 'ADMIN'
    });
    assertCondition('8. Mass assignment: riskLevel injection -> REJECTED', res, r => true, 400);

    res = await request('POST', '/animals', tokenFA, {
      tagId: `TEST-TAG-B-NEW-${TS}`,
      speciesId: species.id,
      farmId: farmB.id, // farmer A creating animal on Farm B
      gender: 'FEMALE',
      ageMonths: 5,
    });
    assertCondition('9. Mass assignment: farm owner override -> DENY', res, r => true, 403);

    // ── Group 5: Case-Specific Mass Assignment (Step 2H) ──────────────────────

    res = await request('POST', '/cases', tokenAdmin, {
      animalId:      animalA.id,
      status:        'CONFIRMED',      // must be rejected
      assignedVetId: vet.id,           // must be rejected at creation
      caseNumber:    'FAKE-CASE-001',  // must be rejected
      createdById:   'injected-id',    // must be rejected
      diagnosis:     'FMD confirmed',  // must be rejected
      confirmed:     true,             // must be rejected
    });
    assertCondition('10. Case creation mass assignment -> REJECTED (Zod strict)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    // ── Group 6: Case Farmer Privacy (Step 2H) ────────────────────────────────

    res = await request('GET', '/cases', tokenFB);
    assertCondition('11. Farmer B GET /cases -> sees own case', res,
      r => Array.isArray(r.data) && !!r.data.find(c => c.id === caseB.id), 200);

    res = await request('GET', `/cases/${caseB.id}`, tokenFB);
    assertCondition('12. Farmer B GET own case by ID -> 200', res,
      r => r.data && r.data.id === caseB.id, 200);

    // ── Group 7: Case Assignment Authorization (Step 2H) ─────────────────────

    res = await request('PUT', `/cases/${caseB.id}/assign`, tokenFA, {
      assignedVetId: vet.id
    });
    assertCondition('13. Farmer attempts vet assignment -> 403', res, r => true, 403);

    res = await request('PUT', `/cases/${caseB.id}/assign`, tokenFA, {
      assignedVetId: farmerA.id
    });
    assertCondition('14. Farmer assigns to self -> 403', res, r => true, 403);

    // ── Group 8: Invalid Status Transition (Step 2H) ─────────────────────────

    // First assign the case to the vet so they can act on it
    await prisma.case.update({ where: { id: caseB.id }, data: { assignedVetId: vet.id, status: 'INVESTIGATING' } });

    res = await request('PUT', `/cases/${caseB.id}/status`, tokenVet, { status: 'RESOLVED' });
    assertCondition('15. Invalid transition INVESTIGATING -> RESOLVED -> 400', res,
      r => r.data?.error?.code === 'INVALID_TRANSITION', 400);

    res = await request('PUT', `/cases/${caseB.id}/status`, tokenVet, { status: 'LAB_PENDING' });
    assertCondition('16. Valid transition INVESTIGATING -> LAB_PENDING -> 200', res,
      r => r.data?.status === 'LAB_PENDING', 200);

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    console.log('--- CLEANING UP TEST DATA ---');
    if (testState.caseB) {
      await prisma.caseStatusHistory.deleteMany({ where: { caseId: testState.caseB.id } }).catch(() => {});
      await prisma.case.delete({ where: { id: testState.caseB.id } }).catch(() => {});
    }
    if (testState.animalB) await prisma.animal.delete({ where: { id: testState.animalB.id } }).catch(() => {});
    if (testState.animalA) await prisma.animal.delete({ where: { id: testState.animalA.id } }).catch(() => {});
    if (testState.farmB)   await prisma.farm.delete({ where: { id: testState.farmB.id } }).catch(() => {});
    if (testState.farmA)   await prisma.farm.delete({ where: { id: testState.farmA.id } }).catch(() => {});
    if (testState.farmerB) await prisma.user.delete({ where: { id: testState.farmerB.id } }).catch(() => {});
    if (testState.farmerA) await prisma.user.delete({ where: { id: testState.farmerA.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

runTests();
