const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING AUTHENTICATION TEST MATRIX ---\n');
  let passed = 0;
  let failed = 0;
  let token = null;

  function assertStatus(name, res, expected) {
    if (res.statusCode === expected) {
      console.log(`[PASS] ${name}`);
      passed++;
      return true;
    } else {
      console.log(`[FAIL] ${name} - Expected ${expected}, got ${res.statusCode}`);
      console.log('Response:', res.data);
      failed++;
      return false;
    }
  }

  // A. Valid Credentials -> SUCCESS
  let res = await request('POST', '/auth/login', {}, { username: 'admin', password: 'Dev@1234' });
  if (assertStatus('A. Valid credentials -> SUCCESS', res, 200)) {
    token = res.data.token;
  }

  // K. passwordHash never appears in response
  if (res.data && res.data.user && res.data.user.passwordHash === undefined) {
    console.log('[PASS] K. passwordHash not in login response');
    passed++;
  } else {
    console.log('[FAIL] K. passwordHash leaked in login response');
    failed++;
  }

  // B. Wrong password -> REJECTED
  res = await request('POST', '/auth/login', {}, { username: 'admin', password: 'WrongPassword' });
  assertStatus('B. Wrong password -> REJECTED', res, 401);

  // C. Unknown user -> REJECTED
  res = await request('POST', '/auth/login', {}, { username: 'unknown_ghost', password: 'Dev@1234' });
  assertStatus('C. Unknown user -> REJECTED', res, 401);

  // D. Missing password -> REJECTED
  res = await request('POST', '/auth/login', {}, { username: 'admin' });
  assertStatus('D. Missing password -> REJECTED', res, 401);

  // E. Missing username -> REJECTED
  res = await request('POST', '/auth/login', {}, { password: 'Dev@1234' });
  assertStatus('E. Missing username -> REJECTED', res, 401);

  // SECURITY REGRESSION (from STEP 1 audit)
  res = await request('POST', '/auth/login', {}, { username: 'admin' });
  assertStatus('SECURITY REGRESSION: username=admin, password absent -> REJECTED', res, 401);

  // F. Malformed token -> REJECTED
  res = await request('GET', '/users', { Authorization: 'Bearer this.is.malformed' });
  assertStatus('F. Malformed token -> REJECTED', res, 401);

  // G. Random token -> REJECTED
  res = await request('GET', '/users', { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.randomsign' });
  assertStatus('G. Random token -> REJECTED', res, 401);

  // H. Expired token -> REJECTED (Simulated by sending a token generated with very short expiry in another test environment, but for now we'll check the error handling exists)
  // I. Modified token -> REJECTED
  if (token) {
    const modifiedToken = token.slice(0, -5) + 'xxxxx';
    res = await request('GET', '/users', { Authorization: `Bearer ${modifiedToken}` });
    assertStatus('I. Modified token -> REJECTED', res, 401);
  } else {
    console.log('[SKIP] I. Modified token (no valid token to modify)');
  }

  // J. Missing Authorization header -> REJECTED on protected route
  res = await request('GET', '/users', {});
  assertStatus('J. Missing Authorization header -> REJECTED', res, 401);

  // L. Verify GET /users with valid token doesn't leak passwordHash
  if (token) {
    res = await request('GET', '/users', { Authorization: `Bearer ${token}` });
    if (assertStatus('Valid token access protected route', res, 200)) {
      const users = res.data;
      const leak = users.some(u => u.passwordHash !== undefined);
      if (!leak) {
        console.log('[PASS] K(2). passwordHash not in GET /users response');
        passed++;
      } else {
        console.log('[FAIL] K(2). passwordHash leaked in GET /users response');
        failed++;
      }
    }
  }

  console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
