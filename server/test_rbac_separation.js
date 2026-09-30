

async function login(username, password) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  return data.token;
}

async function fetchResource(url, token) {
  const res = await fetch(`http://localhost:3000${url}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.status;
}

async function runTest() {
  const adminToken = await login('admin', 'mX9$pQ2#rN7@vL4^');
  const labToken = await login('lab_tech_1', 'qR8#vK4%pM7&gN2@');

  console.log("--- Testing Admin Role ---");
  const adminUsersStatus = await fetchResource('/api/users?page=1&pageSize=10', adminToken);
  console.log(`GET /api/users (Admin-only route): HTTP ${adminUsersStatus} (Expected: 200)`);
  
  const adminLabStatus = await fetchResource('/api/lab/reference', adminToken);
  console.log(`GET /api/lab/reference (Lab route): HTTP ${adminLabStatus} (Expected: 403)`);

  console.log("\n--- Testing Lab Role ---");
  const labUsersStatus = await fetchResource('/api/users?page=1&pageSize=10', labToken);
  console.log(`GET /api/users (Admin-only route): HTTP ${labUsersStatus} (Expected: 403)`);

  const labLabStatus = await fetchResource('/api/lab/reference', labToken);
  console.log(`GET /api/lab/reference (Lab route): HTTP ${labLabStatus} (Expected: 200)`);
}

runTest().catch(console.error);
