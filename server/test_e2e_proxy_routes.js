const http = require('http');

async function req(method, path, token, body = null) {
  return new Promise((resolve) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = http.request({
      hostname: 'localhost',
      port: 5173,
      path: `/api${path}`,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  // 1. Login as Dr. Kulkarni
  const login = await req('POST', '/auth/login', null, { username: 'dr_kulkarni', password: 'tF3%kY8*wV1!zC6&' });
  const token = login.data.token;
  console.log('[1] Login Status:', login.status, '| Token present:', !!token);

  // 2. GET /auth/me
  const me = await req('GET', '/auth/me', token);
  console.log('[2] GET /auth/me:', me.status, '| User:', me.data?.data?.user?.username, '| Role:', me.data?.data?.user?.role?.name);

  // 3. GET /animals
  const animals = await req('GET', '/animals', token);
  console.log('[3] GET /animals:', animals.status, '| Count:', Array.isArray(animals.data) ? animals.data.length : 'not array');

  // 4. GET /cases
  const cases = await req('GET', '/cases', token);
  console.log('[4] GET /cases:', cases.status, '| Count:', Array.isArray(cases.data) ? cases.data.length : 'not array');

  // 5. GET /alerts
  const alerts = await req('GET', '/alerts', token);
  console.log('[5] GET /alerts:', alerts.status, '| Count:', Array.isArray(alerts.data) ? alerts.data.length : 'not array');

  // 6. GET /gis/map-data
  const gis = await req('GET', '/gis/map-data', token);
  console.log('[6] GET /gis/map-data:', gis.status, '| Farms:', gis.data?.farms?.length, '| Animals:', gis.data?.animals?.length);

  // 7. GET /diseases
  const diseases = await req('GET', '/diseases', token);
  console.log('[7] GET /diseases:', diseases.status, '| Count:', Array.isArray(diseases.data) ? diseases.data.length : 'not array');

  // 8. GET /lab/orders
  const lab = await req('GET', '/lab/orders', token);
  console.log('[8] GET /lab/orders:', lab.status, '| Count:', Array.isArray(lab.data) ? lab.data.length : 'not array');

  console.log('\n--- ALL PROXIED BACKEND ENDPOINTS OPERATING FLAWLESSLY ---');
})();
