const BASE = 'http://localhost:3000/api';
const crypto = require('crypto');

async function apicall(endpoint, options, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + endpoint, { ...(options || {}), headers });
  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

function uuid() {
  return crypto.randomUUID();
}

async function run() {
  console.log('--- STARTING SYNC API VERIFICATION ---');

  // 1. Authenticate users
  const farmerARes = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'test_farmer_a', password: 'Dev@1234' }) });
  const farmerA = { token: farmerARes.body.token, user: farmerARes.body.user };
  
  const adminRes = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'Dev@1234' }) });
  const adminToken = adminRes.body.token;

  // 2. Identify an animal owned by Farmer A
  const animalIdA = '1c2e1d0b-7fd7-461e-a5fd-24647b033c59';
  console.log(`Using Animal ID: ${animalIdA} owned by Farmer A`);

  // 3. Find an animal NOT owned by Farmer A
  let otherAnimalId = '57423ded-79f8-4be4-bc66-864bef033c49';

  // TEST 1: Standard Sync + Mass Assignment Protection
  const syncOp1Id = uuid();
  const validSyncPayload = {
    operations: [
      {
        id: syncOp1Id,
        entityName: 'observation',
        actionType: 'CREATE',
        payload: {
          animalId: animalIdA,
          notes: 'Test offline sync note',
          // Malicious fields
          ownerId: 'hacked-owner-id',
          tenantId: 'hacked-tenant-id'
        }
      }
    ]
  };

  console.log('\n[TEST 1] Standard Sync + Mass Assignment Protection');
  const sync1Res = await apicall('/sync', { method: 'POST', body: JSON.stringify(validSyncPayload) }, farmerA.token);
  console.log('Sync 1 Response Body:', JSON.stringify(sync1Res.body, null, 2));
  
  // Fetch DB to verify
  const animalsAdmin = await apicall('/animals/' + animalIdA, {}, adminToken);
  const obs = animalsAdmin.body.data ? animalsAdmin.body.data.observations.find(o => o.notes === 'Test offline sync note') : 
              animalsAdmin.body.observations ? animalsAdmin.body.observations.find(o => o.notes === 'Test offline sync note') : null;
  
  if (obs) {
    console.log('Observation persisted in DB! ID:', obs.id);
    if (obs.tenantId === 'hacked-tenant-id' || obs.ownerId === 'hacked-owner-id') {
      console.error('FAIL: Tenant/Owner ID was overwritten!');
    } else {
      console.log('PASS: Malicious tenantId/ownerId injection ignored.');
    }
  } else {
    console.error('FAIL: Observation not found in DB!');
  }

  // TEST 2: Idempotency
  console.log('\n[TEST 2] Idempotency (Retrying exact same payload)');
  const sync2Res = await apicall('/sync', { method: 'POST', body: JSON.stringify(validSyncPayload) }, farmerA.token);
  if (sync2Res.body.syncResults[0].message === 'Already processed') {
    console.log('PASS: Backend rejected duplicate payload idempotently.');
  } else {
    console.error('FAIL: Did not block duplicate.');
  }

  // TEST 3: RBAC / Cross-tenant
  console.log('\n[TEST 3] RBAC/Authorization (Cross-tenant sync attempt)');
  if (otherAnimalId) {
    const crossTenantPayload = {
      operations: [
        {
          id: uuid(),
          entityName: 'observation',
          actionType: 'CREATE',
          payload: {
            animalId: otherAnimalId,
            notes: 'Hacker note'
          }
        }
      ]
    };
    const sync3Res = await apicall('/sync', { method: 'POST', body: JSON.stringify(crossTenantPayload) }, farmerA.token);
    if (sync3Res.body.syncResults[0].status === 'FAILED' && sync3Res.body.syncResults[0].error.includes('Unauthorized')) {
      console.log('PASS: Backend blocked cross-tenant offline observation.');
    } else {
      console.error('FAIL: Backend accepted unauthorized animal observation.', sync3Res.body);
    }
  } else {
    console.log('WARN: Could not find another farmer\'s animal to test.');
  }

  // TEST 4: Batch Operations (Partial Failure)
  console.log('\n[TEST 4] Batch Sync (Partial Failure)');
  const batchPayload = {
    operations: [
      { // Invalid one
        id: uuid(),
        entityName: 'observation',
        actionType: 'CREATE',
        payload: { notes: 'Invalid (No Animal ID)' }
      },
      { // Valid one
        id: uuid(),
        entityName: 'observation',
        actionType: 'CREATE',
        payload: {
          animalId: animalIdA,
          notes: 'Valid batch sync note'
        }
      }
    ]
  };
  const sync4Res = await apicall('/sync', { method: 'POST', body: JSON.stringify(batchPayload) }, farmerA.token);
  const results = sync4Res.body.syncResults;
  if (results[0].status === 'FAILED' && results[1].status === 'SYNCED') {
    console.log('PASS: Valid operation succeeded even when invalid operation failed in same batch.');
  } else {
    console.error('FAIL: Batch processing logic broke.', results);
  }

}

run().catch(console.error);
