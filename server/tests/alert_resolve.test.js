/**
 * PASHU-RAKSHA — Alert Resolution Test Suite
 *
 * Verifies backend-authoritative alert resolution:
 *  A. Missing authentication → 401
 *  B. Invalid UUID → 400
 *  C. Unauthorized role (Farmer) → 403
 *  D. Cross-tenant isolation → 403
 *  E. Mass assignment protection → 400
 *  F. Valid authenticated resolve by Vet/Official → 200
 *  G. Re-resolving already resolved alert → 409 (ALREADY_RESOLVED)
 *  H. Case relationship preserved (does NOT alter Case status or auto-confirm disease)
 *  I. Database verification of status, timestamp, resolving user, and note
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
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
        resolve({ statusCode: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function makeToken(user, roleName, tenantId = null) {
  const payload = {
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    role: roleName,
  };
  if (tenantId) payload.tenantId = tenantId;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  ALERT RESOLUTION TEST SUITE — PASHU-RAKSHA');
  console.log('══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(name, res, cond, expectedStatus = null) {
    const statusOk = expectedStatus ? res.statusCode === expectedStatus : true;
    const condOk = cond(res);
    if (statusOk && condOk) {
      console.log(`  [PASS] ${name}`);
      passed++;
      return true;
    } else {
      console.log(`  [FAIL] ${name}`);
      console.log(`         Status: ${res.statusCode} (expected: ${expectedStatus || 'any'})`);
      console.log(`         Data: ${JSON.stringify(res.data)?.slice(0, 200)}`);
      failed++;
      return false;
    }
  }

  try {
    console.log('--- Setting up test fixtures ---\n');

    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const vetRole    = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
    const adminRole  = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const district   = await prisma.district.findFirst();
    const species    = await prisma.species.findFirst();

    if (!district || !species || !farmerRole || !vetRole || !adminRole) {
      throw new Error('Missing seed data — ensure database is seeded');
    }

    // Ensure two tenants exist for cross-tenant testing
    let tenantA = await prisma.tenant.findFirst({ where: { slug: 'mh-gov' } });
    if (!tenantA) {
      tenantA = await prisma.tenant.create({
        data: { name: 'Tenant A Gov', slug: 'tenant-a-gov', tenantType: 'GOVERNMENT' }
      });
    }

    let tenantB = await prisma.tenant.findUnique({ where: { slug: 'tenant-b-private' } });
    if (!tenantB) {
      tenantB = await prisma.tenant.create({
        data: { name: 'Tenant B Private', slug: 'tenant-b-private', tenantType: 'DAIRY_CO' }
      });
    }

    const TS = Date.now();

    // Users
    const farmer = await prisma.user.create({
      data: { username: `res_farmer_${TS}`, fullName: 'Farmer Test', roleId: farmerRole.id, email: `rf_${TS}@test.com` }
    });
    const vetA = await prisma.user.create({
      data: { username: `res_vetA_${TS}`, fullName: 'Dr. Vet A', roleId: vetRole.id, email: `rva_${TS}@test.com` }
    });
    const vetB = await prisma.user.create({
      data: { username: `res_vetB_${TS}`, fullName: 'Dr. Vet B', roleId: vetRole.id, email: `rvb_${TS}@test.com` }
    });
    const admin = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });

    // Link vetA to Tenant A
    await prisma.tenantUser.create({
      data: { tenantId: tenantA.id, userId: vetA.id }
    });

    // Link vetB to Tenant B
    await prisma.tenantUser.create({
      data: { tenantId: tenantB.id, userId: vetB.id }
    });

    // Farms
    const farmA = await prisma.farm.create({
      data: {
        code: `FARM-RES-A-${TS}`,
        name: 'Farm Res A',
        districtId: district.id,
        ownerId: farmer.id,
        tenantId: tenantA.id,
        latitude: 18.5204,
        longitude: 73.8567
      }
    });

    // Animals
    const animalA = await prisma.animal.create({
      data: { tagId: `RES-TAG-${TS}`, speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 24 }
    });

    // Health Event
    const healthEvent = await prisma.healthEvent.create({
      data: {
        animalId: animalA.id,
        severity: 'RED',
        summary: 'Elevated temperature and vesicular lesions detected.'
      }
    });

    // Alert 1: Unresolved alert with linked case
    const alert1 = await prisma.alert.create({
      data: {
        healthEventId: healthEvent.id,
        title: 'RED Alert: Suspected FMD',
        severity: 'RED',
        status: 'OPEN',
        district: district.name,
        farmName: farmA.name,
        animalTag: animalA.tagId,
        diseaseName: 'Foot and Mouth Disease',
        recommendedAction: 'Immediate veterinary isolation and clinical review.',
      }
    });

    // Case linked to Alert 1
    const linkedCase = await prisma.case.create({
      data: {
        caseNumber: `CASE-ALERT-RES-${TS}`,
        animalId: animalA.id,
        farmId: farmA.id,
        alertId: alert1.id,
        assignedVetId: vetA.id,
        status: 'INVESTIGATING',
      }
    });

    // Alert 2: Already resolved alert
    const alert2 = await prisma.alert.create({
      data: {
        healthEventId: healthEvent.id,
        title: 'YELLOW Alert: Resolved Example',
        severity: 'YELLOW',
        status: 'RESOLVED',
        district: district.name,
        farmName: farmA.name,
        animalTag: animalA.tagId,
        recommendedAction: 'Resolved.',
      }
    });

    const tokenFarmer = makeToken(farmer, 'FARMER');
    const tokenVetA   = makeToken(vetA, 'VETERINARIAN', tenantA.id);
    const tokenVetB   = makeToken(vetB, 'VETERINARIAN', tenantB.id);
    const tokenAdmin  = makeToken(admin, 'ADMIN');

    console.log('--- Test fixtures ready ---\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1: Missing Authentication
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  [TEST 1] Missing Authentication\n');
    let res = await request('PUT', `/alerts/${alert1.id}/resolve`, null, { resolutionNote: 'Done' });
    assert('1.1 PUT /alerts/:id/resolve without token → 401', res, r => true, 401);

    res = await request('PUT', `/alerts/${alert1.id}/resolve`, 'Bearer invalid.token', { resolutionNote: 'Done' });
    assert('1.2 PUT /alerts/:id/resolve with malformed token → 401', res, r => true, 401);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2: Strict UUID Validation
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 2] Strict UUID Validation\n');
    res = await request('PUT', '/alerts/not-a-valid-uuid/resolve', tokenVetA, { resolutionNote: 'Done' });
    assert('2.1 PUT /alerts/not-a-valid-uuid/resolve → 400 (VALIDATION_ERROR)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: Unauthorized Role (RBAC)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 3] Role Authorization (RBAC)\n');
    res = await request('PUT', `/alerts/${alert1.id}/resolve`, tokenFarmer, { resolutionNote: 'Farmer trying to resolve' });
    assert('3.1 Farmer cannot resolve alert → 403 (FORBIDDEN)', res, r => true, 403);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: Cross-Tenant Isolation
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 4] Cross-Tenant Isolation\n');
    // Vet B belongs to Tenant B, while Alert 1 belongs to Farm in Tenant A
    res = await request('PUT', `/alerts/${alert1.id}/resolve`, tokenVetB, { resolutionNote: 'Cross tenant attempt' });
    assert('4.1 Vet from Tenant B cannot resolve Tenant A alert → 403 (FORBIDDEN)', res,
      r => r.data?.error?.code === 'FORBIDDEN', 403);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: Mass-Assignment Protection (Zod Strict)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 5] Mass Assignment Protection\n');
    res = await request('PUT', `/alerts/${alert1.id}/resolve`, tokenVetA, {
      resolutionNote: 'Valid note',
      status: 'CLOSED',            // injected
      severity: 'GREEN',           // injected
      tenantId: 'injected-tenant', // injected
      resolvedById: 'hacker-id',   // injected
      ownerId: 'hacker-owner'      // injected
    });
    assert('5.1 Reject extra mass-assignment fields → 400 (VALIDATION_ERROR)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6: Non-existent Alert
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 6] Non-existent Alert\n');
    const fakeUuid = '00000000-0000-4000-8000-000000000000';
    res = await request('PUT', `/alerts/${fakeUuid}/resolve`, tokenVetA, { resolutionNote: 'Valid note' });
    assert('6.1 Nonexistent alert UUID → 404 (NOT_FOUND)', res,
      r => r.data?.error?.code === 'NOT_FOUND', 404);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 7: Already Resolved Alert Conflict
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 7] Idempotency & State Protection\n');
    res = await request('PUT', `/alerts/${alert2.id}/resolve`, tokenVetA, { resolutionNote: 'Trying again' });
    assert('7.1 Resolving an already-resolved alert → 409 (ALREADY_RESOLVED)', res,
      r => r.data?.error?.code === 'ALREADY_RESOLVED', 409);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 8: Valid Authenticated Resolution
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 8] Valid Resolution Workflow\n');
    const resolutionNoteText = 'Veterinary clinical examination completed. Isolation confirmed.';
    res = await request('PUT', `/alerts/${alert1.id}/resolve`, tokenVetA, {
      resolutionNote: resolutionNoteText
    });
    assert('8.1 Authorized Vet resolves alert → 200 OK', res,
      r => r.data?.success === true && r.data?.data?.status === 'RESOLVED', 200);

    assert('8.2 Response includes server-determined resolvedBy & resolutionNote', res,
      r => r.data?.data?.resolvedBy?.id === vetA.id && r.data?.data?.resolutionNote === resolutionNoteText);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 9: Database Persistence & Audit Integrity
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 9] Database State Verification\n');
    const dbAlert = await prisma.alert.findUnique({
      where: { id: alert1.id },
      include: { acknowledgements: true }
    });
    assert('9.1 Alert status in database is RESOLVED', { statusCode: 200, data: dbAlert },
      r => r.data.status === 'RESOLVED');

    const dbAck = dbAlert.acknowledgements.find(a => a.userId === vetA.id);
    assert('9.2 AlertAcknowledgement record created with user ID and note', { statusCode: 200, data: dbAck },
      r => r.data && r.data.notes.includes(resolutionNoteText));

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 10: Medical Authority & Linked Case Boundary
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [TEST 10] Medical Authority & Case Boundary\n');
    const dbCase = await prisma.case.findUnique({
      where: { id: linkedCase.id }
    });
    assert('10.1 Linked Case status remains INVESTIGATING (not auto-resolved/auto-confirmed)',
      { statusCode: 200, data: dbCase },
      r => r.data.status === 'INVESTIGATING');

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
