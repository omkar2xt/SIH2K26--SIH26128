/**
 * lab.test.js — STEP 2I: Laboratory Workflow Test Suite
 *
 * Tests: authentication, RBAC, sample creation, sample privacy,
 *        result creation, result privacy, mass assignment protection,
 *        invalid results, duplicate submission, case state transitions,
 *        traceability chain, and cross-tenant access.
 *
 * MEDICAL AUTHORITY: Tests verify that:
 *   - Lab results are DISTINCT from Brain risk output and vet assessments
 *   - POSITIVE + LAB_PENDING → CONFIRMED (server-enforced)
 *   - NEGATIVE + LAB_PENDING → REJECTED  (server-enforced)
 *   - INCONCLUSIVE → no automatic case change
 *   - No client field can inject caseStatus, confirmed, tenantId, animalId into result
 */
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3000;
const TS     = Date.now();

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(name, res, conditionFn, expectedStatus = null) {
  const okStatus = expectedStatus ? res.statusCode === expectedStatus : true;
  const okCond   = conditionFn(res);
  if (okStatus && okCond) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${name}`);
    console.log(`         Status: ${res.statusCode} (expected: ${expectedStatus ?? 'any'})`);
    console.log(`         Data: ${JSON.stringify(res.data)?.slice(0, 300)}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeToken(user, roleName) {
  return jwt.sign(
    { userId: user.id, username: user.username, roleId: user.roleId, role: roleName },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  STEP 2I — LABORATORY WORKFLOW TEST SUITE');
  console.log('══════════════════════════════════════════════════════\n');

  const state = {};

  // ─────────────────────────────────────────────────────────────────────────
  // Fixture setup
  // ─────────────────────────────────────────────────────────────────────────
  console.log('--- Setting up test fixtures ---\n');
  try {
    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const vetRole    = await prisma.role.findUnique({ where: { name: 'VETERINARIAN' } });
    const district   = await prisma.district.findFirst();
    const species    = await prisma.species.findFirst();
    const sampleType = await prisma.sampleType.findFirst();
    const labFacility = await prisma.labFacility.findFirst();
    const diagMethod  = await prisma.diagnosticMethod.findFirst();

    state.sampleType  = sampleType;
    state.labFacility = labFacility;
    state.diagMethod  = diagMethod;

    // Users
    const vetA   = await prisma.user.findUnique({ where: { username: 'dr_kulkarni' } });
    const vetBUser = await prisma.user.create({
      data: { username: `lab_vet_b_${TS}`, fullName: 'Vet B Lab', roleId: vetRole.id, email: `lab_vet_b_${TS}@test.com` }
    });
    const farmerA = await prisma.user.create({
      data: { username: `lab_farmer_a_${TS}`, fullName: 'Lab Farmer A', roleId: farmerRole.id, email: `lab_fa_${TS}@test.com` }
    });
    const farmerB = await prisma.user.create({
      data: { username: `lab_farmer_b_${TS}`, fullName: 'Lab Farmer B', roleId: farmerRole.id, email: `lab_fb_${TS}@test.com` }
    });

    state.vetA = vetA; state.vetBUser = vetBUser;
    state.farmerA = farmerA; state.farmerB = farmerB;

    // Farms
    const farmA = await prisma.farm.create({
      data: { code: `LAB-FARM-A-${TS}`, name: 'Lab Farm A', districtId: district.id, ownerId: farmerA.id, latitude: 0, longitude: 0 }
    });
    const farmB = await prisma.farm.create({
      data: { code: `LAB-FARM-B-${TS}`, name: 'Lab Farm B', districtId: district.id, ownerId: farmerB.id, latitude: 0, longitude: 0 }
    });
    state.farmA = farmA; state.farmB = farmB;

    // Animals
    const animalA = await prisma.animal.create({
      data: { tagId: `LAB-TAG-A-${TS}`, speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 24 }
    });
    const animalB = await prisma.animal.create({
      data: { tagId: `LAB-TAG-B-${TS}`, speciesId: species.id, farmId: farmB.id, gender: 'MALE', ageMonths: 18 }
    });
    state.animalA = animalA; state.animalB = animalB;

    // Cases — Case A will be LAB_PENDING (for transition tests)
    const caseA = await prisma.case.create({
      data: { caseNumber: `LAB-CASE-A-${TS}`, animalId: animalA.id, farmId: farmA.id, assignedVetId: vetA.id, status: 'LAB_PENDING' }
    });
    const caseB = await prisma.case.create({
      data: { caseNumber: `LAB-CASE-B-${TS}`, animalId: animalB.id, farmId: farmB.id, assignedVetId: vetBUser.id, status: 'INVESTIGATING' }
    });
    state.caseA = caseA; state.caseB = caseB;

    // Tokens
    state.tokenVetA   = makeToken(vetA,    'VETERINARIAN');
    state.tokenVetB   = makeToken(vetBUser, 'VETERINARIAN');
    state.tokenFA     = makeToken(farmerA, 'FARMER');
    state.tokenFB     = makeToken(farmerB, 'FARMER');
    const admin       = await prisma.user.findUnique({ where: { username: 'admin' } });
    state.tokenAdmin  = makeToken(admin, 'ADMIN');

    console.log('--- Test fixtures created ---\n');
  } catch (e) {
    console.error('Fixture setup failed:', e.message);
    await prisma.$disconnect();
    return;
  }

  const { caseA, caseB, tokenVetA, tokenVetB, tokenFA, tokenFB, tokenAdmin,
          sampleType, labFacility, diagMethod } = state;

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 1] Authentication
  // ─────────────────────────────────────────────────────────────────────────
  console.log('  [GROUP 1] Authentication\n');

  let res = await request('GET', '/lab/orders', null);
  assert('1.1 GET /lab/orders without token → 401', res, r => true, 401);

  res = await request('GET', '/lab/orders', 'invalid.token.here');
  assert('1.2 GET /lab/orders with invalid token → 401', res, r => true, 401);

  res = await request('POST', '/lab/orders', null, { testName: 'RT-PCR' });
  assert('1.3 POST /lab/orders without token → 401', res, r => true, 401);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 2] Reference Data
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 2] Reference Data\n');

  res = await request('GET', '/lab/reference', tokenVetA);
  assert('2.1 GET /lab/reference → 200 with sampleTypes, labFacilities, diagnosticMethods', res,
    r => r.data?.sampleTypes?.length > 0 && r.data?.labFacilities?.length > 0 && r.data?.diagnosticMethods?.length > 0, 200);

  res = await request('GET', '/lab/reference', tokenFA);
  assert('2.2 Farmer GET /lab/reference → 403 (farmers not in RBAC for reference)', res, r => true, 403);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 3] Sample / Order Creation
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 3] Sample / Order Creation\n');

  res = await request('POST', '/lab/orders', tokenFA, { testName: 'RT-PCR', caseId: caseA.id });
  assert('3.1 Farmer POST /lab/orders → 403', res, r => true, 403);

  res = await request('POST', '/lab/orders', tokenVetA, { testName: 'RT-PCR for FMD' });
  assert('3.2 Vet POST /lab/orders (no case link) → 201 with server-set orderNumber and status=ORDERED', res,
    r => r.data?.orderNumber?.startsWith('LAB-') && r.data?.status === 'ORDERED', 201);
  if (res.data?.id) state.orderNoCase = res.data;
  if (res.data?.samples?.[0]?.tests?.[0]?.id) state.testNoCaseId = res.data.samples[0].tests[0].id;

  res = await request('POST', '/lab/orders', tokenVetA, {
    testName:           'ELISA IgG',
    caseId:             caseA.id,
    labFacilityId:      labFacility?.id,
    sampleTypeId:       sampleType?.id,
    diagnosticMethodId: diagMethod?.id,
    priority:           'URGENT',
  });
  assert('3.3 Vet POST /lab/orders (with case link) → 201', res,
    r => r.data?.orderNumber && r.data?.status === 'ORDERED' && r.data?.case?.id === caseA.id, 201);
  if (res.data?.id) state.orderA = res.data;
  if (res.data?.samples?.[0]?.tests?.[0]?.id) state.testAId = res.data.samples[0].tests[0].id;

  res = await request('POST', '/lab/orders', tokenVetB, {
    testName: 'PCR for FMD',
    caseId:   caseB.id,
  });
  assert('3.4 Vet B POST /lab/orders (case B) → 201', res,
    r => r.data?.orderNumber && r.data?.case?.id === caseB.id, 201);
  if (res.data?.id) state.orderB = res.data;
  if (res.data?.samples?.[0]?.tests?.[0]?.id) state.testBId = res.data.samples[0].tests[0].id;

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 4] Mass Assignment Protection
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 4] Mass Assignment Protection\n');

  res = await request('POST', '/lab/orders', tokenVetA, {
    testName:  'RT-PCR',
    orderNumber: 'INJECTED-001',   // server-set — must be rejected
    status:      'COMPLETED',      // server-set — must be rejected
    requestorId: 'fake-user-id',   // server-set — must be rejected
    caseStatus:  'CONFIRMED',      // not a field — strict schema
  });
  assert('4.1 POST /lab/orders with injected orderNumber/status/requestorId → 400 (Zod strict)', res,
    r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

  res = await request('POST', `/lab/tests/${state.testNoCaseId || '00000000-0000-0000-0000-000000000000'}/result`, tokenVetA, {
    resultOutcome: 'POSITIVE',
    caseId:        caseA.id,          // must be rejected — server derives from test chain
    animalId:      state.animalA?.id, // must be rejected
    confirmed:     true,              // must be rejected
    caseStatus:    'CONFIRMED',       // must be rejected
    tenantId:      'injected',        // must be rejected
    createdBy:     'hacker',          // must be rejected
  });
  assert('4.2 POST /lab/tests/:testId/result with injected fields → 400 (Zod strict)', res,
    r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

  res = await request('PUT', `/lab/orders/${state.orderA?.id || '00000000-0000-0000-0000-000000000000'}/status`, tokenVetA, {
    status:      'SAMPLE_COLLECTED',
    requestorId: 'injected',          // must be rejected
    caseStatus:  'CONFIRMED',         // must be rejected
  });
  assert('4.3 PUT /lab/orders/:id/status with extra fields → 400 (Zod strict)', res,
    r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 5] Order Status State Machine
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 5] Order Status State Machine\n');

  if (state.orderA?.id) {
    res = await request('PUT', `/lab/orders/${state.orderA.id}/status`, tokenVetA, { status: 'COMPLETED' });
    assert('5.1 Invalid transition ORDERED → COMPLETED → 400', res,
      r => r.data?.error?.code === 'INVALID_TRANSITION', 400);

    res = await request('PUT', `/lab/orders/${state.orderA.id}/status`, tokenVetA, { status: 'SAMPLE_COLLECTED' });
    assert('5.2 Valid transition ORDERED → SAMPLE_COLLECTED → 200', res,
      r => r.data?.status === 'SAMPLE_COLLECTED', 200);

    res = await request('PUT', `/lab/orders/${state.orderA.id}/status`, tokenVetA, { status: 'ORDERED' });
    assert('5.3 Invalid backwards transition SAMPLE_COLLECTED → ORDERED → 400', res,
      r => r.data?.error?.code === 'INVALID_TRANSITION', 400);
  } else {
    console.log('  [SKIP] 5.1-5.3 (orderA not created)');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 6] Privacy — Farmer sees only own animal's orders
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 6] Privacy — Farmer Isolation\n');

  res = await request('GET', '/lab/orders', tokenFA);
  assert('6.1 Farmer A GET /lab/orders → sees own orders (none for Farm A case is none because caseA assigned to vet)', res,
    r => Array.isArray(r.data) && !r.data.find(o => o.id === state.orderB?.id), 200);

  res = await request('GET', `/lab/orders/${state.orderB?.id}`, tokenFA);
  assert('6.2 Farmer A GET Farm B order → 404', res, r => true, 404);

  res = await request('GET', `/lab/orders/${state.orderA?.id}`, tokenFB);
  assert('6.3 Farmer B GET Farm A order → 404', res, r => true, 404);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 7] Privacy — Vet sees only their authorized orders
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 7] Privacy — Vet Isolation\n');

  res = await request('GET', '/lab/orders', tokenVetA);
  assert('7.1 Vet A GET /lab/orders → sees own orders (not Vet B orders)', res,
    r => Array.isArray(r.data) && !r.data.find(o => o.id === state.orderB?.id), 200);

  res = await request('GET', `/lab/orders/${state.orderB?.id}`, tokenVetA);
  assert('7.2 Vet A GET Vet B order → 404', res, r => true, 404);

  res = await request('GET', `/lab/orders/${state.orderA?.id}`, tokenVetA);
  assert('7.3 Vet A GET own order → 200', res,
    r => r.data?.id === state.orderA?.id, 200);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 8] Result Creation
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 8] Result Creation\n');

  res = await request('GET', `/lab/tests/${state.testAId}/result`, tokenVetA);
  assert('8.1 GET /lab/tests/:testId/result (no result yet) → 200 with empty results[]', res,
    r => Array.isArray(r.data?.results) && r.data.results.length === 0, 200);

  res = await request('POST', `/lab/tests/${state.testAId}/result`, tokenFA, { resultOutcome: 'POSITIVE' });
  assert('8.2 Farmer POST result → 403 (farmers cannot record results)', res, r => true, 403);

  res = await request('POST', `/lab/tests/${state.testBId}/result`, tokenVetA, { resultOutcome: 'POSITIVE' });
  assert('8.3 Vet A POST result on Vet B test → 404 (unauthorized)', res, r => true, 404);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 9] Invalid Result Values
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 9] Invalid Result Values\n');

  res = await request('POST', `/lab/tests/${state.testAId}/result`, tokenVetA, { resultOutcome: 'CONFIRMED' });
  assert('9.1 Invalid resultOutcome "CONFIRMED" → 400 (not in enum)', res,
    r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

  res = await request('POST', `/lab/tests/${state.testAId}/result`, tokenVetA, { resultOutcome: 'Positive' });
  assert('9.2 Invalid resultOutcome "Positive" (case sensitive) → 400', res,
    r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

  res = await request('POST', `/lab/tests/${state.testAId}/result`, tokenVetA, {});
  assert('9.3 Missing resultOutcome → 400', res,
    r => r.data?.error?.code === 'VALIDATION_ERROR', 400);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 10] Case Transition from Lab Result
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 10] Case Transition from Lab Result\n');

  // testAId is linked to caseA which is LAB_PENDING
  res = await request('POST', `/lab/tests/${state.testAId}/result`, tokenVetA, {
    resultOutcome: 'POSITIVE',
    remarks:       'Ct value: 24.1 — clear amplification curve confirmed',
    verifiedBy:    'Dr. Kulkarni — Senior Pathologist',
  });
  assert('10.1 POSITIVE result on LAB_PENDING case → 201', res,
    r => r.data?.result?.resultOutcome === 'POSITIVE', 201);
  assert('10.2 POSITIVE result triggers case transition → CONFIRMED', res,
    r => r.data?.caseTransition?.transitioned === true && r.data?.caseTransition?.newStatus === 'CONFIRMED', 201);
  assert('10.3 Result has _authority = LABORATORY_RESULT (not Brain output)', res,
    r => r.data?.result?._authority === 'LABORATORY_RESULT', 201);

  // Verify in DB
  const dbCase = await prisma.case.findUnique({ where: { id: caseA.id } });
  assert('10.4 Case status in DB = CONFIRMED after POSITIVE lab result', { statusCode: 200, data: dbCase }, r => r.data?.status === 'CONFIRMED', 200);

  // For NEGATIVE test: use Vet B's order (caseB is INVESTIGATING, not LAB_PENDING)
  // First advance caseB to LAB_PENDING in DB
  await prisma.case.update({ where: { id: caseB.id }, data: { status: 'LAB_PENDING' } });

  res = await request('POST', `/lab/tests/${state.testBId}/result`, tokenVetB, {
    resultOutcome: 'NEGATIVE',
    remarks:       'No amplification detected. Sample quality: good.',
  });
  assert('10.5 NEGATIVE result on LAB_PENDING case → 201', res,
    r => r.data?.result?.resultOutcome === 'NEGATIVE', 201);
  assert('10.6 NEGATIVE result triggers case transition → REJECTED', res,
    r => r.data?.caseTransition?.transitioned === true && r.data?.caseTransition?.newStatus === 'REJECTED', 201);

  // INCONCLUSIVE: use the orderNoCase test (no case linked → no transition)
  if (state.testNoCaseId) {
    res = await request('POST', `/lab/tests/${state.testNoCaseId}/result`, tokenVetA, {
      resultOutcome: 'INCONCLUSIVE',
      remarks:       'Borderline result. Repeat test recommended.',
    });
    assert('10.7 INCONCLUSIVE result → 201, no case transition', res,
      r => r.data?.result?.resultOutcome === 'INCONCLUSIVE', 201);
    assert('10.8 INCONCLUSIVE caseTransition.transitioned = false', res,
      r => r.data?.caseTransition?.transitioned === false, 201);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 11] Duplicate Result Prevention
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 11] Duplicate Result Prevention\n');

  res = await request('POST', `/lab/tests/${state.testAId}/result`, tokenVetA, {
    resultOutcome: 'NEGATIVE',
  });
  assert('11.1 Duplicate result submission → 409 DUPLICATE_RESULT', res,
    r => r.data?.error?.code === 'DUPLICATE_RESULT', 409);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 12] Traceability Chain
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 12] Traceability Chain\n');

  if (state.orderA?.id) {
    // Verify DB chain: Animal → Case → LabOrder → LabSample → LabTest → LabResult
    const dbOrder = await prisma.labOrder.findUnique({
      where: { id: state.orderA.id },
      include: {
        case:    { include: { animal: true } },
        samples: { include: { tests: { include: { results: true } } } }
      }
    });

    assert('12.1 LabOrder exists in DB', { statusCode: 200, data: dbOrder }, r => !!r.data?.id, 200);
    assert('12.2 LabOrder.case linked to correct case', { statusCode: 200, data: dbOrder }, r => r.data?.case?.id === caseA.id, 200);
    assert('12.3 LabOrder.case.animal linked to correct animal', { statusCode: 200, data: dbOrder }, r => r.data?.case?.animal?.id === state.animalA?.id, 200);
    assert('12.4 LabSample exists under order', { statusCode: 200, data: dbOrder }, r => (r.data?.samples?.length || 0) > 0, 200);
    assert('12.5 LabTest exists under sample', { statusCode: 200, data: dbOrder }, r => (r.data?.samples?.[0]?.tests?.length || 0) > 0, 200);
    assert('12.6 LabResult exists under test (POSITIVE)', { statusCode: 200, data: dbOrder }, r => r.data?.samples?.[0]?.tests?.[0]?.results?.[0]?.resultOutcome === 'POSITIVE', 200);
    assert('12.7 Traceability: Animal→Case→Order→Sample→Test→Result chain complete in DB', { statusCode: 200, data: dbOrder },
      r => r.data?.case?.animal?.id && r.data?.id && r.data?.samples?.[0]?.tests?.[0]?.results?.[0]?.id, 200);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 13] Admin Full Access
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 13] Admin Access\n');

  res = await request('GET', '/lab/orders', tokenAdmin);
  assert('13.1 Admin GET /lab/orders → sees all orders (both A and B)', res,
    r => Array.isArray(r.data) && r.data.find(o => o.id === state.orderA?.id) && r.data.find(o => o.id === state.orderB?.id), 200);

  res = await request('GET', `/lab/orders/${state.orderA?.id}`, tokenAdmin);
  assert('13.2 Admin GET any order by ID → 200', res, r => r.data?.id === state.orderA?.id, 200);

  // ─────────────────────────────────────────────────────────────────────────
  // [GROUP 14] Result Immutability
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n  [GROUP 14] Result Immutability\n');

  res = await request('POST', `/lab/tests/${state.testAId}/result`, tokenAdmin, {
    resultOutcome: 'NEGATIVE',
    remarks:       'Correction attempt',
  });
  assert('14.1 Admin attempt to overwrite existing result → 409 DUPLICATE_RESULT', res,
    r => r.data?.error?.code === 'DUPLICATE_RESULT', 409);

  // ─────────────────────────────────────────────────────────────────────────
  // Final results
  // ─────────────────────────────────────────────────────────────────────────
  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`══════════════════════════════════════════════════════\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────
  console.log('--- Cleaning up test fixtures ---');
  try {
    // Results → Tests → Samples → Orders (must delete in reverse dependency order)
    const orders = [state.orderA, state.orderB, state.orderNoCase].filter(Boolean);
    for (const order of orders) {
      const fullOrder = await prisma.labOrder.findUnique({
        where: { id: order.id },
        include: { samples: { include: { tests: { include: { results: true } } } } }
      });
      if (fullOrder) {
        for (const sample of (fullOrder.samples || [])) {
          for (const test of (sample.tests || [])) {
            await prisma.labResult.deleteMany({ where: { labTestId: test.id } }).catch(() => {});
            await prisma.labTest.delete({ where: { id: test.id } }).catch(() => {});
          }
          await prisma.labSample.delete({ where: { id: sample.id } }).catch(() => {});
        }
        await prisma.labOrder.delete({ where: { id: order.id } }).catch(() => {});
      }
    }

    // Cases
    await prisma.caseStatusHistory.deleteMany({ where: { caseId: { in: [caseA.id, caseB.id] } } }).catch(() => {});
    await prisma.case.delete({ where: { id: caseA.id } }).catch(() => {});
    await prisma.case.delete({ where: { id: caseB.id } }).catch(() => {});

    // Animals, Farms, Users
    if (state.animalA?.id) await prisma.animal.delete({ where: { id: state.animalA.id } }).catch(() => {});
    if (state.animalB?.id) await prisma.animal.delete({ where: { id: state.animalB.id } }).catch(() => {});
    if (state.farmA?.id)   await prisma.farm.delete({ where: { id: state.farmA.id } }).catch(() => {});
    if (state.farmB?.id)   await prisma.farm.delete({ where: { id: state.farmB.id } }).catch(() => {});
    if (state.vetBUser?.id)  await prisma.user.delete({ where: { id: state.vetBUser.id } }).catch(() => {});
    if (state.farmerA?.id)   await prisma.user.delete({ where: { id: state.farmerA.id } }).catch(() => {});
    if (state.farmerB?.id)   await prisma.user.delete({ where: { id: state.farmerB.id } }).catch(() => {});

    console.log('--- Cleanup complete ---\n');
  } catch (e) {
    console.error('Cleanup error (non-fatal):', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

run().catch(e => {
  console.error('Test runner fatal error:', e);
  prisma.$disconnect().finally(() => process.exit(1));
});
