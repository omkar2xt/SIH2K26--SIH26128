const http = require('http');

async function test(u, p) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ code: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ code: res.statusCode, body: data });
        }
      });
    });
    req.write(JSON.stringify({ username: u, password: p }));
    req.end();
  });
}

(async () => {
  const users = [
    ['admin', 'mX9$pQ2#rN7@vL4^'],
    ['dr_kulkarni', 'tF3%kY8*wV1!zC6&'],
    ['test_farmer_a', 'hB5^nJ2$mD9@fX3*'],
    ['lab_tech_1', 'qR8#vK4%pM7&gN2@'],
    ['district_official', 'dO4$mK8#vL2@qW9*'],
    ['field_worker_1', 'fW3^pK7$mD1@vX8*']
  ];
  for (const [u, p] of users) {
    const r = await test(u, p);
    console.log('[LOGIN TEST]', u, 'Status:', r.code, 'Role:', r.body?.user?.role?.name, 'Token:', !!r.body?.token);
  }
})();
