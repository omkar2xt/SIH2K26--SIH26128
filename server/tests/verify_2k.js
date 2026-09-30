const http = require('http');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../server/.env' });

const prisma = new PrismaClient();
const PORT = 3000;
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
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });
    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function makeToken(user, roleName) {
  return jwt.sign(
    { userId: user.id, username: user.username, roleId: user.roleId, role: roleName, districtId: user.districtId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );
}

async function runTests() {
  const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
  const vetRole = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
  const distRole = await prisma.role.findUnique({ where: { name: 'DISTRICT_OFFICIAL' } });
  const stateRole = await prisma.role.findUnique({ where: { name: 'STATE_OFFICIAL' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });

  const district1 = await prisma.district.findFirst();
  const district2 = await prisma.district.findFirst({ skip: 1 });
  const species = await prisma.species.findFirst();

  const pwd = 'hashedpassword123';
  const farmerA = await prisma.user.create({ data: { username: `fa_${TS}`, fullName: 'Farmer A', roleId: farmerRole.id, email: `a_${TS}@t.com`, passwordHash: pwd } });
  const farmerB = await prisma.user.create({ data: { username: `fb_${TS}`, fullName: 'Farmer B', roleId: farmerRole.id, email: `b_${TS}@t.com`, passwordHash: pwd } });
  const vet = await prisma.user.create({ data: { username: `v_${TS}`, fullName: 'Vet', roleId: vetRole.id, email: `v_${TS}@t.com`, passwordHash: pwd } });
  const distOfficial = await prisma.user.create({ data: { username: `do_${TS}`, fullName: 'Dist Off', roleId: distRole.id, email: `do_${TS}@t.com`, passwordHash: pwd, districtId: district1.id } });
  const distOfficial2 = await prisma.user.create({ data: { username: `do2_${TS}`, fullName: 'Dist Off 2', roleId: distRole.id, email: `do2_${TS}@t.com`, passwordHash: pwd, districtId: district2.id } });
  const stateOfficial = await prisma.user.create({ data: { username: `so_${TS}`, fullName: 'State Off', roleId: stateRole.id, email: `so_${TS}@t.com`, passwordHash: pwd } });
  const admin = await prisma.user.create({ data: { username: `ad_${TS}`, fullName: 'Admin', roleId: adminRole.id, email: `ad_${TS}@t.com`, passwordHash: pwd } });

  const tFA = makeToken(farmerA, 'FARMER');
  const tFB = makeToken(farmerB, 'FARMER');
  const tVet = makeToken(vet, 'VETERINARIAN');
  const tDO1 = makeToken(distOfficial, 'DISTRICT_OFFICIAL');
  const tDO2 = makeToken(distOfficial2, 'DISTRICT_OFFICIAL');
  const tSO = makeToken(stateOfficial, 'STATE_OFFICIAL');
  const tAdmin = makeToken(admin, 'ADMIN');

  const farmA = await prisma.farm.create({ data: { code: `FA_${TS}`, name: 'Farm A', districtId: district1.id, ownerId: farmerA.id, latitude: 19.0, longitude: 75.0 } });
  const farmB = await prisma.farm.create({ data: { code: `FB_${TS}`, name: 'Farm B', districtId: district2.id, ownerId: farmerB.id, latitude: 19.1, longitude: 75.1 } });

  const cluster = await prisma.cluster.create({
    data: {
      code: `CL_EPI_${TS}`, districtId: district1.id, animalCount: 2, status: 'POTENTIAL_CLUSTER', description: 'Test',
      members: { create: [ { farmId: farmA.id, animalTag: `T1_${TS}`, riskLevel: 'RED' }, { farmId: farmA.id, animalTag: `T2_${TS}`, riskLevel: 'RED' } ] }
    }
  });

  console.log("A. Farmer A → own GIS data:", (await request('GET', '/gis/map-data', tFA)).status);
  
  const mapDataFA = await request('GET', '/gis/map-data', tFA);
  const seesFarmB = mapDataFA.data.data.farms.some(f => f.id === farmB.id);
  console.log("B. Farmer A → Farmer B GIS data:", seesFarmB ? "Can see" : "Cannot see (Isolated)");

  console.log("C. Farmer A → Farmer B exposure:", (await request('GET', '/epidemiology/exposure', tFA)).status);
  console.log("D. Farmer A → Farmer B cluster:", (await request('GET', '/epidemiology/clusters', tFA)).status);
  
  console.log("E. Vet authorized resource:", (await request('GET', '/gis/map-data', tVet)).status);
  console.log("F. Vet unauthorized resource (cluster verify):", (await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, tVet, { status: 'CONFIRMED_OUTBREAK' })).status);
  
  console.log("G. District Official → own district:", (await request('GET', '/epidemiology/clusters', tDO1)).status);
  
  const dist2Verify = await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, tDO2, { status: 'CONFIRMED_OUTBREAK' });
  console.log("H. District Official → another district (cluster verify):", dist2Verify.status);
  
  console.log("I. State Official → authorized state:", (await request('GET', '/epidemiology/clusters', tSO)).status);
  console.log("J. Normal user (Farmer) → official cluster verification:", (await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, tFA, { status: 'CONFIRMED_OUTBREAK' })).status);
  console.log("K. Unauthorized official → cluster outside scope:", dist2Verify.status);
  
  const adminVerify = await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, tAdmin, { status: 'CONFIRMED_OUTBREAK', containmentRadiusKm: 5 });
  console.log("L. Admin → authorized operation:", adminVerify.status);

  console.log("\n4. MASS-ASSIGNMENT TEST:");
  const massAssign = await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, tSO, { status: 'CONTAINED', tenantId: 'hacked123', districtId: 'hacked456', ownerId: 'hacked789' });
  console.log("Status:", massAssign.status);
  if (massAssign.status === 400) console.log("Zod errors:", JSON.stringify(massAssign.data.error.details));

  console.log("\n5. CLUSTER STATE MACHINE:");
  console.log("Invalid status -> rejected:", (await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, tSO, { status: 'INVALID' })).status);
  console.log("HACKED -> rejected:", (await request('PUT', `/epidemiology/clusters/${cluster.id}/verify`, tSO, { status: 'HACKED' })).status);
  
  const confirmed = await prisma.cluster.findUnique({ where: { id: cluster.id }, include: { containment: true } });
  console.log("\n6. CONTAINMENT ZONE:");
  console.log("Containment Status:", confirmed?.containment?.status);
  console.log("Containment Radius:", confirmed?.containment?.radiusKm);
  
  console.log("\n7. GIS INPUT VALIDATION:");
  // Let's test createFarm endpoint for validation
  const badCoords = await request('POST', '/farms', tFA, { code: 'BAD', name: 'BAD', districtId: district1.id, latitude: 900, longitude: 900 });
  console.log("Invalid latitude/longitude status:", badCoords.status);

  // cleanup
  await prisma.clusterMember.deleteMany({ where: { clusterId: cluster.id } });
  await prisma.containmentZone.deleteMany({ where: { clusterId: cluster.id } });
  await prisma.cluster.deleteMany({ where: { id: cluster.id } });
  await prisma.farm.deleteMany({ where: { id: { in: [farmA.id, farmB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [farmerA.id, farmerB.id, vet.id, distOfficial.id, distOfficial2.id, stateOfficial.id, admin.id] } } });
  
  await prisma.$disconnect();
}
runTests();
