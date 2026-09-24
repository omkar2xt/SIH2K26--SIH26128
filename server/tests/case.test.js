/**
 * STEP 2H — Case Workflow Test Suite
 *
 * Tests:
 *  - Authentication requirement
 *  - RBAC enforcement
 *  - Farmer own case access (PASS)
 *  - Farmer foreign case access (DENY → 404)
 *  - Vet assigned case access (PASS)
 *  - Vet unassigned case access (DENY)
 *  - Unauthorized vet assignment (DENY)
 *  - Farmer attempts vet assignment (DENY)
 *  - Farmer assigns to self (DENY)
 *  - Mass assignment injection (DENY)
 *  - Invalid status transition (DENY)
 *  - Alert → Case traceability
 *  - Case deduplication
 *  - Medical authority: vetAssessment ≠ confirmed diagnosis
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

function makeToken(user, roleName) {
  return jwt.sign(
    { userId: user.id, username: user.username, roleId: user.roleId, role: roleName },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runTests() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  STEP 2H — CASE WORKFLOW TEST SUITE');
  console.log('══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  const state = {};

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
    // ──────────────────────────────────────────────────────────────────────────
    // SETUP: Create test fixtures
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- Setting up test fixtures ---\n');

    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const vetRole    = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
    const adminRole  = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const district   = await prisma.district.findFirst();
    const species    = await prisma.species.findFirst();

    if (!district || !species || !farmerRole || !vetRole || !adminRole) {
      throw new Error('Missing seed data — run seed first');
    }

    // Users
    const farmerA = await prisma.user.create({
      data: { username: `case_test_farmerA_${Date.now()}`, fullName: 'Farmer A', roleId: farmerRole.id, email: `fa_${Date.now()}@test.com` }
    });
    const farmerB = await prisma.user.create({
      data: { username: `case_test_farmerB_${Date.now()}`, fullName: 'Farmer B', roleId: farmerRole.id, email: `fb_${Date.now()}@test.com` }
    });
    const vetA = await prisma.user.create({
      data: { username: `case_test_vetA_${Date.now()}`, fullName: 'Vet A', roleId: vetRole.id, email: `va_${Date.now()}@test.com` }
    });
    const vetB = await prisma.user.create({
      data: { username: `case_test_vetB_${Date.now()}`, fullName: 'Vet B', roleId: vetRole.id, email: `vb_${Date.now()}@test.com` }
    });
    const admin = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });

    // Farms
    const farmA = await prisma.farm.create({
      data: { code: `FARM-CASE-A-${Date.now()}`, name: 'Farm A', districtId: district.id, ownerId: farmerA.id, latitude: 0, longitude: 0 }
    });
    const farmB = await prisma.farm.create({
      data: { code: `FARM-CASE-B-${Date.now()}`, name: 'Farm B', districtId: district.id, ownerId: farmerB.id, latitude: 0, longitude: 0 }
    });

    // Animals
    const animalA = await prisma.animal.create({
      data: { tagId: `CASE-TAG-A-${Date.now()}`, speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 12 }
    });
    const animalB = await prisma.animal.create({
      data: { tagId: `CASE-TAG-B-${Date.now()}`, speciesId: species.id, farmId: farmB.id, gender: 'FEMALE', ageMonths: 12 }
    });

    // Alert for traceability test
    const alert = await prisma.alert.create({
      data: {
        title: 'Test Alert for Case',
        severity: 'ORANGE',
        status: 'OPEN',
        district: district.name,
        farmName: farmA.name,
        animalTag: animalA.tagId,
        recommendedAction: 'Veterinary inspection recommended.',
      }
    });

    // Pre-create a case for Farmer B's animal (assigned to Vet A)
    const caseB = await prisma.case.create({
      data: {
        caseNumber: `CASE-TEST-B-${Date.now()}`,
        animalId: animalB.id,
        farmId: farmB.id,
        assignedVetId: vetA.id,
        status: 'INVESTIGATING',
      }
    });

    // Case for Farmer A (unassigned) for vet denial tests
    const caseA_unassigned = await prisma.case.create({
      data: {
        caseNumber: `CASE-TEST-A-${Date.now()}`,
        animalId: animalA.id,
        farmId: farmA.id,
        status: 'SUSPECTED',
      }
    });

    state.farmerA = farmerA; state.farmerB = farmerB;
    state.vetA = vetA; state.vetB = vetB;
    state.farmA = farmA; state.farmB = farmB;
    state.animalA = animalA; state.animalB = animalB;
    state.alert = alert; state.caseB = caseB; state.caseA = caseA_unassigned;

    const tokenFA    = makeToken(farmerA, 'FARMER');
    const tokenFB    = makeToken(farmerB, 'FARMER');
    const tokenVetA  = makeToken(vetA,    'VETERINARIAN');
    const tokenVetB  = makeToken(vetB,    'VETERINARIAN');
    const tokenAdmin = makeToken(admin,   'ADMIN');

    console.log('--- Test fixtures created ---\n');

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 1: Authentication
    // ──────────────────────────────────────────────────────────────────────────
    console.log('  [GROUP 1] Authentication\n');

    let res = await request('GET', '/cases', null);
    assert('1.1 GET /cases without token → 401', res, r => true, 401);

    res = await request('GET', '/cases', 'Bearer invalid.token.here');
    assert('1.2 GET /cases with invalid token → 401', res, r => true, 401);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 2: Farmer Privacy Tests
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 2] Farmer Privacy\n');

    res = await request('GET', '/cases', tokenFA);
    assert('2.1 Farmer A GET /cases → sees own cases only (no Farm B cases)', res,
      r => Array.isArray(r.data) && !r.data.find(c => c.id === caseB.id), 200);

    res = await request('GET', `/cases/${caseB.id}`, tokenFA);
    assert('2.2 Farmer A GET /cases/:id (Farm B case) → 404', res, r => true, 404);

    res = await request('GET', `/cases/${caseA_unassigned.id}`, tokenFA);
    assert('2.3 Farmer A GET /cases/:id (own case) → 200', res,
      r => r.data && r.data.id === caseA_unassigned.id, 200);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 3: Veterinarian Privacy Tests
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 3] Veterinarian Privacy\n');

    res = await request('GET', '/cases', tokenVetA);
    assert('3.1 Vet A GET /cases → sees assigned cases', res,
      r => Array.isArray(r.data) && r.data.find(c => c.id === caseB.id), 200);

    res = await request('GET', '/cases', tokenVetB);
    assert('3.2 Vet B GET /cases → does NOT see Vet A\'s case', res,
      r => Array.isArray(r.data) && !r.data.find(c => c.id === caseB.id), 200);

    res = await request('GET', `/cases/${caseB.id}`, tokenVetB);
    assert('3.3 Vet B GET /cases/:id (Vet A case) → 404', res, r => true, 404);

    res = await request('GET', `/cases/${caseB.id}`, tokenVetA);
    assert('3.4 Vet A GET /cases/:id (own assigned case) → 200', res,
      r => r.data && r.data.id === caseB.id, 200);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 4: RBAC — Case Creation
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 4] RBAC — Case Creation\n');

    res = await request('POST', '/cases', tokenFA, {
      animalId: animalA.id
    });
    assert('4.1 Farmer POST /cases → 403 (farmers cannot create cases)', res, r => true, 403);

    res = await request('POST', '/cases', tokenVetA, {
      animalId: animalA.id,
      priority: 'HIGH'
    });
    // animalA already has caseA_unassigned active — deduplication guard expected to fire
    // Use a fresh animal with no case for the success path
    const animalFresh = await prisma.animal.create({
      data: { tagId: `CASE-TAG-FRESH-${Date.now()}`, speciesId: species.id, farmId: farmA.id, gender: 'MALE', ageMonths: 6 }
    });
    state.animalFresh = animalFresh;
    res = await request('POST', '/cases', tokenVetA, {
      animalId: animalFresh.id,
      priority: 'HIGH'
    });
    assert('4.2 Vet POST /cases (fresh animal) → 201 with server-set caseNumber and status=SUSPECTED', res,
      r => r.data && r.data.caseNumber && r.data.status === 'SUSPECTED' && !r.data.assignedVetId, 201);
    if (res.data?.id) state.newCaseId = res.data.id;

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 5: Mass Assignment Protection
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 5] Mass Assignment Protection\n');

    res = await request('POST', '/cases', tokenAdmin, {
      animalId:       animalB.id,
      status:         'CONFIRMED',     // must be rejected by Zod strict
      assignedVetId:  vetA.id,         // must be rejected
      createdById:    'injected-id',   // must be rejected
      caseNumber:     'FAKE-CASE-001', // must be rejected
      diagnosis:      'FMD confirmed', // must be rejected
      confirmed:      true,            // must be rejected
      tenantId:       'injected',      // must be rejected
      ownerId:        'injected',      // must be rejected
    });
    assert('5.1 POST /cases with mass-assignment fields → 400 (Zod strict)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    res = await request('PUT', `/cases/${caseB.id}/assign`, tokenAdmin, {
      assignedVetId:  vetA.id,
      status:         'CONFIRMED',   // must be rejected
      tenantId:       'injected',    // must be rejected
      ownerId:        'injected',    // must be rejected
    });
    assert('5.2 PUT /cases/:id/assign with extra fields → 400 (Zod strict)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    res = await request('PUT', `/cases/${caseB.id}/status`, tokenAdmin, {
      status:    'INVESTIGATING',
      diagnosis: 'confirmed FMD',   // must be rejected
      confirmed: true,               // must be rejected
    });
    assert('5.3 PUT /cases/:id/status with extra fields → 400 (Zod strict)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    res = await request('POST', `/cases/${caseB.id}/assessment`, tokenVetA, {
      vetAssessment:  'Clinical findings noted.',
      status:         'CONFIRMED',     // must be rejected
      confirmed:      true,            // must be rejected
      diagnosis:      'Lab confirmed', // must be rejected
    });
    assert('5.4 POST /assessment with extra fields → 400 (Zod strict)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 6: Status Transition Enforcement
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 6] Status Transition Enforcement\n');

    // caseB is INVESTIGATING — try to jump to RESOLVED (invalid)
    res = await request('PUT', `/cases/${caseB.id}/status`, tokenVetA, {
      status: 'RESOLVED'
    });
    assert('6.1 Invalid transition INVESTIGATING → RESOLVED → 400', res,
      r => r.data?.error?.code === 'INVALID_TRANSITION', 400);

    // Valid transition: INVESTIGATING → LAB_PENDING
    res = await request('PUT', `/cases/${caseB.id}/status`, tokenVetA, {
      status: 'LAB_PENDING'
    });
    assert('6.2 Valid transition INVESTIGATING → LAB_PENDING → 200', res,
      r => r.data?.status === 'LAB_PENDING', 200);

    // Invalid: LAB_PENDING → SUSPECTED (backwards)
    res = await request('PUT', `/cases/${caseB.id}/status`, tokenVetA, {
      status: 'SUSPECTED'
    });
    assert('6.3 Invalid backwards transition LAB_PENDING → SUSPECTED → 400', res,
      r => r.data?.error?.code === 'INVALID_TRANSITION', 400);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 7: Vet Assignment Authorization
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 7] Vet Assignment Authorization\n');

    res = await request('PUT', `/cases/${caseA_unassigned.id}/assign`, tokenFA, {
      assignedVetId: vetA.id
    });
    assert('7.1 Farmer attempts vet assignment → 403', res, r => true, 403);

    // Farmer assigning to self — blocked by role (farmers are 403'd before self-check)
    res = await request('PUT', `/cases/${caseA_unassigned.id}/assign`, tokenFA, {
      assignedVetId: farmerA.id
    });
    assert('7.2 Farmer assigns to self → 403', res, r => true, 403);

    // Vet B tries to assign caseB (assigned to Vet A) to themselves — should fail
    res = await request('PUT', `/cases/${caseB.id}/assign`, tokenVetB, {
      assignedVetId: vetB.id
    });
    assert('7.3 Vet B attempts self-assign on Vet A\'s case → 404 (not found in scope)', res,
      r => true, 404);

    // Vet A can self-assign to unassigned case
    res = await request('PUT', `/cases/${caseA_unassigned.id}/assign`, tokenVetA, {
      assignedVetId: vetA.id
    });
    assert('7.4 Vet A self-assigns to unassigned case → 200', res,
      r => r.data?.assignedVetId === vetA.id, 200);

    // Admin assigns to non-VETERINARIAN user → 400
    res = await request('PUT', `/cases/${caseA_unassigned.id}/assign`, tokenAdmin, {
      assignedVetId: farmerA.id   // farmer, not vet
    });
    assert('7.5 Admin assigns to non-VETERINARIAN → 400 INVALID_ASSIGNMENT', res,
      r => r.data?.error?.code === 'INVALID_ASSIGNMENT', 400);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 8: Veterinary Assessment (Medical Authority)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 8] Medical Authority — Veterinary Assessment\n');

    // Valid assessment by assigned vet
    res = await request('POST', `/cases/${caseB.id}/assessment`, tokenVetA, {
      vetAssessment: 'Animal presents with reduced appetite and elevated temperature. Differential: FMD risk. Recommending nasal swab and blood serum for laboratory confirmation.'
    });
    assert('8.1 Assigned vet records assessment → 200', res,
      r => r.data?.vetAssessment && r.data.status === 'LAB_PENDING', 200);
    assert('8.2 Assessment does NOT change status', res,
      r => r.data?.status === 'LAB_PENDING', 200);
    assert('8.3 Assessment stored as vetAssessment (not clinicalNotes)', res,
      r => r.data?.vetAssessment?.includes('nasal swab'), 200);

    // Unassigned vet (Vet B) cannot assess Vet A's case
    res = await request('POST', `/cases/${caseB.id}/assessment`, tokenVetB, {
      vetAssessment: 'Unauthorized assessment attempt'
    });
    assert('8.4 Unassigned vet cannot record assessment → 404', res, r => true, 404);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 9: Case Deduplication
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 9] Case Deduplication\n');

    // Animal B already has an active case (caseB)
    res = await request('POST', '/cases', tokenAdmin, {
      animalId: animalB.id,
      priority: 'HIGH'
    });
    assert('9.1 Duplicate case for same animal → 409 DUPLICATE_CASE', res,
      r => r.data?.error?.code === 'DUPLICATE_CASE', 409);

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 10: Alert → Case Traceability
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 10] Alert → Case Traceability\n');

    // Create case from alert (animalA's alert; animalA's existing case is now INVESTIGATING — resolve first)
    // Resolve caseA first so we can create a new one from alert
    await prisma.case.update({
      where: { id: caseA_unassigned.id },
      data: { status: 'RESOLVED' }
    });

    res = await request('POST', `/cases/from-alert/${alert.id}`, tokenAdmin);
    const traceCase = res.data;
    assert('10.1 Create case from alert → 201', res,
      r => r.data?.id && r.data.caseNumber, 201);
    assert('10.2 Case linked to alert (alertId FK)', res,
      r => r.data?.alertId === alert.id, 201);
    assert('10.3 Case animalId resolved from alert.animalTag', res,
      r => r.data?.animalId === animalA.id, 201);
    assert('10.4 Case status starts as SUSPECTED', res,
      r => r.data?.status === 'SUSPECTED', 201);
    assert('10.5 clinicalNotes contain risk assessment language (not confirmed diagnosis)', res,
      r => r.data?.clinicalNotes?.includes('risk assessment') || r.data?.clinicalNotes?.includes('not a clinical'), 201);

    if (traceCase?.id) {
      // Verify DB chain: Case → Alert → HealthEvent (if exists) → Animal
      const dbCase = await prisma.case.findUnique({
        where: { id: traceCase.id },
        include: {
          alert: { include: { healthEvent: { include: { snapshots: true } } } },
          animal: true
        }
      });
      const chainOk = dbCase && dbCase.alert?.id === alert.id && dbCase.animal?.id === animalA.id;
      if (chainOk) {
        console.log('  [PASS] 10.6 DB chain: Case → Alert → Animal traceable');
        passed++;
      } else {
        console.log('  [FAIL] 10.6 DB chain broken');
        failed++;
      }
      state.traceCase = traceCase;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GROUP 11: Invalid Status via Client
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n  [GROUP 11] Invalid Status Injection\n');

    res = await request('PUT', `/cases/${caseB.id}/status`, tokenVetA, {
      status: 'INFECTED'   // not a valid status
    });
    assert('11.1 Invalid status string → 400 VALIDATION_ERROR', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    res = await request('PUT', `/cases/${caseB.id}/status`, tokenVetA, {
      status: 'CONFIRMED',
      diagnosis: 'FMD confirmed',   // not in schema
    });
    assert('11.2 Status with extra diagnosis field → 400 (strict)', res,
      r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

    // ──────────────────────────────────────────────────────────────────────────
    // RESULTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n[ERROR] Test execution failed:', err);
    failed++;
  } finally {
    console.log('--- Cleaning up test fixtures ---');
    try {
      if (state.traceCase?.id)   await prisma.case.delete({ where: { id: state.traceCase.id } }).catch(() => {});
      if (state.newCaseId)        await prisma.case.delete({ where: { id: state.newCaseId } }).catch(() => {});
      if (state.caseA?.id)        await prisma.case.delete({ where: { id: state.caseA.id } }).catch(() => {});
      if (state.caseB?.id) {
        await prisma.caseStatusHistory.deleteMany({ where: { caseId: state.caseB.id } }).catch(() => {});
        await prisma.case.delete({ where: { id: state.caseB.id } }).catch(() => {});
      }
      if (state.alert?.id)        await prisma.alert.delete({ where: { id: state.alert.id } }).catch(() => {});
      if (state.animalFresh?.id)  await prisma.animal.delete({ where: { id: state.animalFresh.id } }).catch(() => {});
      if (state.animalB?.id)      await prisma.animal.delete({ where: { id: state.animalB.id } }).catch(() => {});
      if (state.animalA?.id)      await prisma.animal.delete({ where: { id: state.animalA.id } }).catch(() => {});
      if (state.farmB?.id)        await prisma.farm.delete({ where: { id: state.farmB.id } }).catch(() => {});
      if (state.farmA?.id)        await prisma.farm.delete({ where: { id: state.farmA.id } }).catch(() => {});
      if (state.vetB?.id)         await prisma.user.delete({ where: { id: state.vetB.id } }).catch(() => {});
      if (state.vetA?.id)         await prisma.user.delete({ where: { id: state.vetA.id } }).catch(() => {});
      if (state.farmerB?.id)      await prisma.user.delete({ where: { id: state.farmerB.id } }).catch(() => {});
      if (state.farmerA?.id)      await prisma.user.delete({ where: { id: state.farmerA.id } }).catch(() => {});
      console.log('--- Cleanup complete ---\n');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
