async function login(username, password) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  return data.token;
}

async function fetchResource(url, method, token, body = null) {
  const options = {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`http://localhost:3000${url}`, options);
  return res.status;
}

async function runTest() {
  const adminToken = await login('admin', 'mX9$pQ2#rN7@vL4^');
  const labToken = await login('lab_tech_1', 'qR8#vK4%pM7&gN2@');

  const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';

  const endpoints = [
    // LAB Endpoints
    { name: 'GET /api/lab/reference', url: '/api/lab/reference', method: 'GET', type: 'LAB' },
    { name: 'POST /api/lab/orders', url: '/api/lab/orders', method: 'POST', body: {}, type: 'LAB' },
    { name: 'PUT /api/lab/orders/:id/status', url: `/api/lab/orders/${DUMMY_UUID}/status`, method: 'PUT', body: { status: 'RECEIVED' }, type: 'LAB' },
    { name: 'POST /api/lab/tests/:testId/result', url: `/api/lab/tests/${DUMMY_UUID}/result`, method: 'POST', body: { resultOutcome: 'POSITIVE' }, type: 'LAB' },
    
    // ADMIN Endpoints
    { name: 'GET /api/users', url: '/api/users?page=1&pageSize=10', method: 'GET', type: 'ADMIN' },
    { name: 'GET /api/devices', url: '/api/devices?page=1&pageSize=10', method: 'GET', type: 'ADMIN' },
  ];

  console.log("== Testing DIAGNOSTIC_LABORATORY Role ==");
  for (const ep of endpoints) {
    const status = await fetchResource(ep.url, ep.method, labToken, ep.body);
    const expected = ep.type === 'LAB' ? 'Allowed (2xx/400/404)' : 'Denied (403)';
    const result = ep.type === 'LAB' ? (status !== 403 ? 'PASS' : 'FAIL') : (status === 403 ? 'PASS' : 'FAIL');
    console.log(`[${result}] ${ep.name} -> HTTP ${status} | Expected: ${expected}`);
  }

  console.log("\n== Testing ADMIN Role ==");
  for (const ep of endpoints) {
    const status = await fetchResource(ep.url, ep.method, adminToken, ep.body);
    const expected = ep.type === 'ADMIN' ? 'Allowed (2xx/400/404)' : 'Denied (403)';
    const result = ep.type === 'ADMIN' ? (status !== 403 ? 'PASS' : 'FAIL') : (status === 403 ? 'PASS' : 'FAIL');
    console.log(`[${result}] ${ep.name} -> HTTP ${status} | Expected: ${expected}`);
  }
}

runTest().catch(console.error);
