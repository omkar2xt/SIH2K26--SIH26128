/**
 * vaccination.test.js — STEP 2J: Vaccination Workflow Test Suite
 */
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3000;
const TS     = Date.now();

function request(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port: PORT, path: `/api${path}`, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function makeToken(user, roleName) {
  return jwt.sign(
    { userId: user.id, username: user.username, roleId: user.roleId, role: roleName },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

let passed = 0, failed = 0;
function pass(msg) { passed++; console.log(`  [PASS] ${msg}`); }
function fail(msg, expected, res) { failed++; console.log(`  [FAIL] ${msg}\n         Expected: ${expected}\n         Got: ${res.statusCode} - ${JSON.stringify(res.data)}`); }

async function runTests() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  STEP 2J — VACCINATION WORKFLOW TEST SUITE');
  console.log('══════════════════════════════════════════════════════\n');
  
  const state = {};

  try {
    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const vetRole    = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
    const district   = await prisma.district.findFirst();
    const species    = await prisma.species.findFirst();

    const vaccine = await prisma.vaccine.create({ data: { name: `FMD-VAC-${TS}`, type: 'VIRAL' } });
    state.vaccine = vaccine;

    const pwd = 'hashedpassword123';
    const farmerA = await prisma.user.create({ data: { username: `vac_farmer_a_${TS}`, fullName: 'Vac Farmer A', roleId: farmerRole.id, email: `vac_fa_${TS}@test.com`, passwordHash: pwd } });
    const farmerB = await prisma.user.create({ data: { username: `vac_farmer_b_${TS}`, fullName: 'Vac Farmer B', roleId: farmerRole.id, email: `vac_fb_${TS}@test.com`, passwordHash: pwd } });
    const vetUser = await prisma.user.create({ data: { username: `vac_vet_${TS}`, fullName: 'Vac Vet', roleId: vetRole.id, email: `vac_vet_${TS}@test.com`, passwordHash: pwd } });
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });

    state.farmerA = farmerA; state.farmerB = farmerB; state.vetUser = vetUser;

    const farmA = await prisma.farm.create({ data: { code: `VAC-FARM-A-${TS}`, name: 'Vac Farm A', districtId: district.id, ownerId: farmerA.id, latitude: 0, longitude: 0 } });
    const farmB = await prisma.farm.create({ data: { code: `VAC-FARM-B-${TS}`, name: 'Vac Farm B', districtId: district.id, ownerId: farmerB.id, latitude: 0, longitude: 0 } });
    state.farmA = farmA; state.farmB = farmB;

    const animalA = await prisma.animal.create({ data: { tagId: `VAC-TAG-A-${TS}`, speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 24 } });
    const animalB = await prisma.animal.create({ data: { tagId: `VAC-TAG-B-${TS}`, speciesId: species.id, farmId: farmB.id, gender: 'MALE', ageMonths: 18 } });
    state.animalA = animalA; state.animalB = animalB;

    state.tokenFA     = makeToken(farmerA, 'FARMER');
    state.tokenFB     = makeToken(farmerB, 'FARMER');
    state.tokenVet    = makeToken(vetUser, 'VETERINARIAN');
    state.tokenAdmin  = makeToken(adminUser, 'ADMIN');

    console.log('  [GROUP 1] Authentication & References\n');
    let res = await request('GET', '/vaccinations/reference', null);
    if (res.statusCode === 401) pass('1.1 GET /vaccinations/reference without token → 401');
    else fail('1.1 GET /vaccinations/reference without token → 401', 401, res);

    res = await request('GET', '/vaccinations/reference', state.tokenFA);
    if (res.statusCode === 200 && res.data.success && res.data.data.length > 0) pass('1.2 GET /vaccinations/reference with token → 200');
    else fail('1.2 GET /vaccinations/reference with token → 200', '200 + success', res);

    console.log('\n  [GROUP 2] Creation & Authorization\n');
    res = await request('POST', '/vaccinations', state.tokenFA, { animalId: state.animalA.id, vaccineId: state.vaccine.id, vaccineName: state.vaccine.name, administeredAt: new Date().toISOString() });
    if (res.statusCode === 201 && res.data.success) pass('2.1 Farmer A POST /vaccinations (own animal) → 201');
    else fail('2.1 Farmer A POST /vaccinations (own animal) → 201', 201, res);

    res = await request('POST', '/vaccinations', state.tokenFA, { animalId: state.animalB.id, vaccineName: 'Some Vaccine' });
    if (res.statusCode === 404) pass('2.2 Farmer A POST /vaccinations (Farmer B animal) → 404');
    else fail('2.2 Farmer A POST /vaccinations (Farmer B animal) → 404', 404, res);

    res = await request('POST', '/vaccinations', state.tokenVet, { animalId: state.animalB.id, vaccineName: 'Vet Administered Vaccine' });
    if (res.statusCode === 201) pass('2.3 Vet POST /vaccinations (any animal) → 201');
    else fail('2.3 Vet POST /vaccinations (any animal) → 201', 201, res);

    console.log('\n  [GROUP 3] Mass Assignment Protection\n');
    res = await request('POST', '/vaccinations', state.tokenFA, { animalId: state.animalA.id, vaccineName: 'Test Vaccine', tenantId: 'fake-tenant-id', createdBy: 'hacker' });
    if (res.statusCode === 400 && res.data.error.code === 'VALIDATION_ERROR') pass('3.1 POST /vaccinations with injected fields → 400 (Zod strict)');
    else fail('3.1 POST /vaccinations with injected fields → 400 (Zod strict)', 400, res);

    console.log('\n  [GROUP 4] Duplicate Prevention\n');
    await request('POST', '/vaccinations', state.tokenFA, { animalId: state.animalA.id, vaccineName: 'Duplicate Test Vaccine', administeredAt: '2026-09-24T00:00:00.000Z' });
    res = await request('POST', '/vaccinations', state.tokenFA, { animalId: state.animalA.id, vaccineName: 'Duplicate Test Vaccine', administeredAt: '2026-09-24T00:00:00.000Z' });
    if (res.statusCode === 409 && res.data.error.code === 'DUPLICATE_VACCINATION') pass('4.1 Duplicate exact submission → 409');
    else fail('4.1 Duplicate exact submission → 409', 409, res);

    console.log('\n  [GROUP 5] Retrieval & RBAC Scoping\n');
    res = await request('GET', '/vaccinations', state.tokenFA);
    const hasAnimalB = res.data?.data?.some(v => v.animalId === state.animalB.id);
    if (res.statusCode === 200 && res.data.data.length > 0 && !hasAnimalB) pass('5.1 Farmer A GET /vaccinations → sees own only');
    else fail('5.1 Farmer A GET /vaccinations → sees own only', '200 + no animalB', res);

    res = await request('GET', '/vaccinations', state.tokenAdmin);
    const hasAnimalAAdmin = res.data?.data?.some(v => v.animalId === state.animalA.id);
    const hasAnimalBAdmin = res.data?.data?.some(v => v.animalId === state.animalB.id);
    if (res.statusCode === 200 && hasAnimalAAdmin && hasAnimalBAdmin) pass('5.2 Admin GET /vaccinations → sees all');
    else fail('5.2 Admin GET /vaccinations → sees all', '200 + see all', res);

    console.log('\n  [GROUP 6] Stats aggregation\n');
    res = await request('GET', '/vaccinations/stats', state.tokenAdmin);
    if (res.statusCode === 200 && res.data.data.totalRecords !== undefined) pass('6.1 GET /vaccinations/stats → returns aggregated data');
    else fail('6.1 GET /vaccinations/stats → returns aggregated data', 200, res);

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    console.log('\n══════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('══════════════════════════════════════════════════════\n');
    try {
      if (state.animalA) {
        await prisma.vaccinationRecord.deleteMany({ where: { animalId: { in: [state.animalA.id, state.animalB.id] } } });
        await prisma.animal.deleteMany({ where: { id: { in: [state.animalA.id, state.animalB.id] } } });
      }
      if (state.farmA) await prisma.farm.deleteMany({ where: { id: { in: [state.farmA.id, state.farmB.id] } } });
      if (state.farmerA) await prisma.user.deleteMany({ where: { id: { in: [state.farmerA.id, state.farmerB.id, state.vetUser.id] } } });
      if (state.vaccine) await prisma.vaccine.deleteMany({ where: { id: state.vaccine.id } });
    } catch(e) {}
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
