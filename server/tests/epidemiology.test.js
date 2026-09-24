/**
 * epidemiology.test.js — STEP 2K: Exposure & Cluster Workflow Test Suite
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
    { userId: user.id, username: user.username, roleId: user.roleId, role: roleName, districtId: user.districtId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

let passed = 0, failed = 0;
function pass(msg) { passed++; console.log(`  [PASS] ${msg}`); }
function fail(msg, expected, res) { failed++; console.log(`  [FAIL] ${msg}\n         Expected: ${expected}\n         Got: ${res.statusCode} - ${JSON.stringify(res.data)}`); }

async function runTests() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  STEP 2K — EPIDEMIOLOGY WORKFLOW TEST SUITE');
  console.log('══════════════════════════════════════════════════════\n');
  
  const state = {};

  try {
    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const distRole   = await prisma.role.findUnique({ where: { name: 'DISTRICT_OFFICIAL' } });
    const district1  = await prisma.district.findFirst();
    const district2  = await prisma.district.findFirst({ skip: 1 });
    const species    = await prisma.species.findFirst();

    const pwd = 'hashedpassword123';
    const farmerA = await prisma.user.create({ data: { username: `epi_farmer_a_${TS}`, fullName: 'Epi Farmer A', roleId: farmerRole.id, email: `epi_fa_${TS}@test.com`, passwordHash: pwd } });
    const official1 = await prisma.user.create({ data: { username: `epi_dist1_${TS}`, fullName: 'Official D1', roleId: distRole.id, email: `epi_d1_${TS}@test.com`, passwordHash: pwd } });

    state.farmerA = farmerA; state.official1 = official1;

    // We manually set districtId on the official payload for token generation
    official1.districtId = district1.id;

    const farmA = await prisma.farm.create({ data: { code: `EPI-FARM-A-${TS}`, name: 'Epi Farm A', districtId: district1.id, ownerId: farmerA.id, latitude: 19.0, longitude: 75.0 } });
    state.farmA = farmA;

    const animalA = await prisma.animal.create({ data: { tagId: `EPI-TAG-A-${TS}`, speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 24, riskLevel: 'RED' } });
    const animalB = await prisma.animal.create({ data: { tagId: `EPI-TAG-B-${TS}`, speciesId: species.id, farmId: farmA.id, gender: 'MALE', ageMonths: 18, riskLevel: 'RED' } });
    state.animalA = animalA; state.animalB = animalB;

    const cluster = await prisma.cluster.create({
      data: {
        code: `CL_EPI_${TS}`,
        districtId: district1.id,
        animalCount: 2,
        status: 'POTENTIAL_CLUSTER',
        description: 'Test cluster',
        members: {
          create: [
            { farmId: farmA.id, animalTag: animalA.tagId, riskLevel: 'RED' },
            { farmId: farmA.id, animalTag: animalB.tagId, riskLevel: 'RED' }
          ]
        }
      }
    });
    state.cluster = cluster;

    state.tokenFA = makeToken(farmerA, 'FARMER');
    state.tokenD1 = makeToken(official1, 'DISTRICT_OFFICIAL');

    console.log('  [GROUP 1] Map Data (GIS) API\n');
    let res = await request('GET', '/gis/map-data', state.tokenFA);
    if (res.statusCode === 200 && res.data.data.farms.some(f => f.id === farmA.id)) pass('1.1 Farmer GET /gis/map-data → sees own farm');
    else fail('1.1 Farmer GET /gis/map-data → sees own farm', '200 + sees farm', res);

    console.log('\n  [GROUP 2] Epidemiology Clusters API\n');
    res = await request('GET', '/epidemiology/clusters', state.tokenD1);
    if (res.statusCode === 200 && res.data.data.some(c => c.id === cluster.id)) pass('2.1 Official GET /epidemiology/clusters → sees district cluster');
    else fail('2.1 Official GET /epidemiology/clusters → sees district cluster', '200 + sees cluster', res);

    console.log('\n  [GROUP 3] Cluster Verification (Outbreak Authority)\n');
    // Try to update cluster with bad data
    res = await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, state.tokenD1, { status: 'HACKED' });
    if (res.statusCode === 400) pass('3.1 Official PUT cluster verify with bad status → 400 (Zod schema protection)');
    else fail('3.1 Official PUT cluster verify with bad status → 400', 400, res);

    // Confirm outbreak
    res = await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, state.tokenD1, { status: 'CONFIRMED_OUTBREAK', containmentRadiusKm: 5.5 });
    if (res.statusCode === 200 && res.data.data.status === 'CONFIRMED_OUTBREAK' && res.data.data.containment.radiusKm === 5.5) pass('3.2 Official PUT cluster verify CONFIRMED_OUTBREAK → Creates containment zone');
    else fail('3.2 Official PUT cluster verify CONFIRMED_OUTBREAK → Creates containment zone', '200 + confirmed + containment', res);

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    console.log('\n══════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('══════════════════════════════════════════════════════\n');
    try {
      if (state.cluster) {
        await prisma.clusterMember.deleteMany({ where: { clusterId: state.cluster.id } });
        await prisma.containmentZone.deleteMany({ where: { clusterId: state.cluster.id } });
        await prisma.cluster.deleteMany({ where: { id: state.cluster.id } });
      }
      if (state.animalA) await prisma.animal.deleteMany({ where: { id: { in: [state.animalA.id, state.animalB.id] } } });
      if (state.farmA) await prisma.farm.deleteMany({ where: { id: state.farmA.id } });
      if (state.farmerA) await prisma.user.deleteMany({ where: { id: { in: [state.farmerA.id, state.official1.id] } } });
    } catch(e) {}
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
