const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

function request(method, path, headers = {}, bodyStr = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
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
        let parsed = null;
        try { parsed = JSON.parse(data); } catch(e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed || data
        });
      });
    });

    req.on('error', reject);

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function runTests() {
  console.log('--- STARTING API HARDENING TEST MATRIX ---\n');
  let passed = 0;
  let failed = 0;
  const prisma = new PrismaClient();

  function assertCondition(name, res, conditionFn, expectedStatus = null) {
    const okStatus = expectedStatus ? res.statusCode === expectedStatus : true;
    const okCond = conditionFn(res);
    if (okStatus && okCond) {
      console.log(`[PASS] ${name}`);
      passed++;
      return true;
    } else {
      console.log(`[FAIL] ${name} - Status: ${res.statusCode} | Data/Headers: ${JSON.stringify(res.data) || JSON.stringify(res.headers)}`);
      failed++;
      return false;
    }
  }

  try {
    const admin = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });
    const token = jwt.sign(
      { userId: admin.id, username: admin.username, roleId: admin.roleId, role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 1. Pagination Overfetch Protection
    let res = await request('GET', '/api/diseases?pageSize=9999', authHeaders);
    assertCondition('1. Pagination overfetch limit -> REJECTED (400)', res, r => r.data && r.data.error?.code === 'VALIDATION_ERROR', 400);

    // 2. Pagination Negative Page -> REJECTED
    res = await request('GET', '/api/diseases?page=-5', authHeaders);
    assertCondition('2. Negative pagination -> REJECTED (400)', res, r => r.data && r.data.error?.code === 'VALIDATION_ERROR', 400);

    // 3. Malformed UUID (Params) -> REJECTED
    res = await request('GET', '/api/animals/not-a-valid-uuid', authHeaders);
    assertCondition('3. Malformed UUID Param -> REJECTED (400)', res, r => r.data && r.data.error?.code === 'VALIDATION_ERROR', 400);

    // 4. JSON Payload Too Large (>100kb) -> 413
    const hugePayload = JSON.stringify({ username: "a".repeat(150000), password: "b" });
    res = await request('POST', '/api/auth/login', {}, hugePayload);
    assertCondition('4. Oversized payload (>100kb) -> REJECTED (413)', res, r => r.data && r.data.error?.code === 'PAYLOAD_TOO_LARGE', 413);

    // 5. Malformed JSON -> 400 (SyntaxError caught)
    res = await request('POST', '/api/auth/login', {}, '{ "username": "bad, "password": "b" ');
    assertCondition('5. Malformed JSON -> REJECTED (400)', res, r => r.data && r.data.error?.code === 'MALFORMED_JSON', 400);

    // 6. CORS headers on safe origin vs evil origin
    res = await request('OPTIONS', '/api/health', { 'Origin': 'http://evil.com' });
    const corsAllow = res.headers['access-control-allow-origin'];
    assertCondition('6. CORS blocks arbitrary domains (No wildcard/evil echo)', res, r => corsAllow !== '*' && corsAllow !== 'http://evil.com');

    // 7. Security Headers (Helmet)
    res = await request('GET', '/api/health');
    assertCondition('7. Helmet security headers present (X-DNS-Prefetch-Control, Content-Security-Policy)', res, r => !!r.headers['x-dns-prefetch-control'] && !!r.headers['content-security-policy'], 200);

    // 8. Rate Limiting (Login Endpoint max 5 per window)
    for (let i = 0; i < 5; i++) {
      await request('POST', '/api/auth/login', {}, JSON.stringify({ username: 'a', password: 'b' }));
    }
    res = await request('POST', '/api/auth/login', {}, JSON.stringify({ username: 'a', password: 'b' })); // 6th request
    assertCondition('8. Rate Limiter triggers on >5 rapid logins -> 429', res, r => r.data && r.data.error?.code === 'RATE_LIMIT_EXCEEDED', 429);

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
