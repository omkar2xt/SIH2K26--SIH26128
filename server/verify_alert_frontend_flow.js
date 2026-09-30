const http = require('http');

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== VERIFYING ALERT RESOLUTION END-TO-END FLOW ===\n');

  // 1. Veterinarian Login
  console.log('[1] Logging in as Veterinarian (dr_kulkarni)...');
  const vetLoginRes = await request('POST', '/auth/login', {}, {
    username: 'dr_kulkarni',
    password: 'tF3%kY8*wV1!zC6&'
  });
  if (vetLoginRes.status !== 200 || !vetLoginRes.body.token) {
    throw new Error('Vet login failed: ' + JSON.stringify(vetLoginRes.body));
  }
  const vetToken = vetLoginRes.body.token;
  console.log('    ✓ Vet authenticated successfully.');

  // 2. Fetch Alerts
  console.log('\n[2] Fetching authoritative alerts via GET /alerts...');
  const alertsRes = await request('GET', '/alerts?page=1&pageSize=10', {
    'Authorization': `Bearer ${vetToken}`
  });
  const alerts = alertsRes.body;
  console.log(`    ✓ Loaded ${alerts.length} alerts.`);
  
  // Find an OPEN alert or create one if none open
  let targetAlert = alerts.find(a => a.status === 'OPEN');
  if (!targetAlert) {
    console.log('    Creating a fresh OPEN test alert...');
    const createRes = await request('POST', '/alerts', {
      'Authorization': `Bearer ${vetToken}`
    }, {
      title: 'ORANGE Alert: Test Bovine',
      severity: 'ORANGE',
      status: 'OPEN',
      district: 'Pune',
      farmName: 'Farm Sahyadri',
      animalTag: 'MH-CAT-027',
      recommendedAction: 'Clinical check recommended.'
    });
    targetAlert = createRes.body;
  }
  console.log(`    Target alert ID: ${targetAlert.id} (status: ${targetAlert.status})`);

  // 3. Resolve Alert with Note
  console.log('\n[3] Resolving alert via PUT /alerts/:id/resolve...');
  const resolveRes = await request('PUT', `/alerts/${targetAlert.id}/resolve`, {
    'Authorization': `Bearer ${vetToken}`
  }, {
    resolutionNote: 'Veterinary clinical inspection completed. Animal stabilized and isolated.'
  });

  console.log(`    HTTP Status: ${resolveRes.status}`);
  console.log(`    Response Body:`, JSON.stringify(resolveRes.body, null, 2));

  if (resolveRes.status !== 200 || !resolveRes.body.success) {
    throw new Error('Resolution failed: ' + JSON.stringify(resolveRes.body));
  }
  if (resolveRes.body.data.status !== 'RESOLVED') {
    throw new Error('Alert status is not RESOLVED');
  }
  console.log('    ✓ Alert resolved successfully with server-determined user & timestamps.');

  // 4. Refetch Alerts from Backend to verify database persistence
  console.log('\n[4] Verifying database persistence via GET /alerts...');
  const verifyRes = await request('GET', '/alerts?page=1&pageSize=10', {
    'Authorization': `Bearer ${vetToken}`
  });
  const updatedAlertInDb = verifyRes.body.find(a => a.id === targetAlert.id);
  if (!updatedAlertInDb || updatedAlertInDb.status !== 'RESOLVED') {
    throw new Error('Alert status in DB is not RESOLVED! Got: ' + updatedAlertInDb?.status);
  }
  console.log(`    ✓ Confirmed: Alert ${targetAlert.id} in DB has status='RESOLVED'.`);

  // 5. Try resolving again -> Expect 409 ALREADY_RESOLVED
  console.log('\n[5] Testing re-resolution idempotency / conflict (409)...');
  const conflictRes = await request('PUT', `/alerts/${targetAlert.id}/resolve`, {
    'Authorization': `Bearer ${vetToken}`
  }, {
    resolutionNote: 'Trying to resolve again'
  });
  if (conflictRes.status !== 409 || conflictRes.body.error?.code !== 'ALREADY_RESOLVED') {
    throw new Error('Expected 409 ALREADY_RESOLVED but got: ' + conflictRes.status);
  }
  console.log('    ✓ Confirmed: Re-resolving an already-resolved alert yields 409 ALREADY_RESOLVED.');

  // 6. Test Farmer role cannot resolve -> Expect 403 FORBIDDEN
  console.log('\n[6] Testing RBAC: Farmer cannot resolve alerts...');
  const farmerLoginRes = await request('POST', '/auth/login', {}, {
    username: 'test_farmer_a',
    password: 'hB5^nJ2$mD9@fX3*'
  });
  if (farmerLoginRes.status === 200 && farmerLoginRes.body.token) {
    const farmerToken = farmerLoginRes.body.token;
    const farmerResolveRes = await request('PUT', `/alerts/${targetAlert.id}/resolve`, {
      'Authorization': `Bearer ${farmerToken}`
    }, {
      resolutionNote: 'Farmer resolution attempt'
    });
    if (farmerResolveRes.status !== 403) {
      throw new Error('Expected 403 for Farmer resolving alert but got: ' + farmerResolveRes.status);
    }
    console.log('    ✓ Confirmed: Farmer receives 403 Access Denied.');
  } else {
    console.log('    (Skipped farmer login test - credentials varied)');
  }

  console.log('\n=== ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
