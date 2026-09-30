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
  console.log('══════════════════════════════════════════════════════');
  console.log('  VERIFYING VETERINARIAN LOCATION & GIS FLOW');
  console.log('══════════════════════════════════════════════════════\n');

  // 1. Veterinarian Login
  console.log('[1] Logging in as Veterinarian (dr_kulkarni)...');
  const vetLogin = await request('POST', '/auth/login', {}, {
    username: 'dr_kulkarni',
    password: 'tF3%kY8*wV1!zC6&'
  });
  if (vetLogin.status !== 200 || !vetLogin.body.token) {
    throw new Error('Vet login failed: ' + JSON.stringify(vetLogin.body));
  }
  const vetToken = vetLogin.body.token;
  console.log('    ✓ Vet authenticated.');

  // 2. Fetch GIS map data as Veterinarian
  console.log('\n[2] Fetching GIS map data (GET /gis/map-data)...');
  const gisRes = await request('GET', '/gis/map-data', {
    'Authorization': `Bearer ${vetToken}`
  });
  if (gisRes.status !== 200 || !gisRes.body.success) {
    throw new Error('GIS map data fetch failed: ' + JSON.stringify(gisRes.body));
  }
  const { farms, animals } = gisRes.body.data;
  console.log(`    ✓ Loaded ${farms.length} farms and ${animals.length} animals on GIS.`);

  // 3. Test Priority Alert Queue Animals
  const queueAnimals = [
    { name: 'Kali',     tag: 'MH-BUF-009', expectedFarm: 'Rathi Buffalo Farm', expectedDistrict: 'Nagpur' },
    { name: 'Kamdhenu', tag: 'MH-CAT-027', expectedDistrict: 'Pune' },
    { name: 'Shyama',   tag: 'MH-BUF-022', expectedDistrict: 'Chhatrapati Sambhajinagar' },
    { name: 'Bhola',    tag: 'MH-SHP-061', expectedDistrict: 'Kolhapur' },
    { name: 'Yamuna',   tag: 'MH-CAT-078', expectedDistrict: 'Pune' },
  ];

  console.log('\n[3] Verifying all Priority Alert Queue animals:');
  for (const item of queueAnimals) {
    console.log(`\n  Checking ${item.name} (${item.tag}):`);
    const res = await request('GET', `/animals/by-tag/${item.tag}`, {
      'Authorization': `Bearer ${vetToken}`
    });

    if (res.status !== 200) {
      throw new Error(`Failed to fetch animal ${item.tag}: status ${res.status}`);
    }

    const animal = res.body;
    const farm = animal.farm;
    if (!farm) {
      throw new Error(`Animal ${item.tag} has no farm relation!`);
    }

    const districtName = farm.district?.name || farm.district;
    const lat = farm.latitude;
    const lng = farm.longitude;

    console.log(`    - Farm:     ${farm.name}`);
    console.log(`    - District: ${districtName}`);
    console.log(`    - Location: ${lat}° N, ${lng}° E`);

    if (item.expectedFarm && !farm.name.toLowerCase().includes(item.expectedFarm.toLowerCase())) {
      throw new Error(`Expected farm ${item.expectedFarm}, got ${farm.name}`);
    }
    if (item.expectedDistrict && !districtName.toLowerCase().includes(item.expectedDistrict.toLowerCase())) {
      throw new Error(`Expected district ${item.expectedDistrict}, got ${districtName}`);
    }
    if (typeof lat !== 'number' || typeof lng !== 'number' || lat === 0 && lng === 0) {
      throw new Error(`Invalid coordinates for ${item.tag}: lat=${lat}, lng=${lng}`);
    }

    // Verify animal exists in GIS mapData
    const farmOnGis = farms.find(f => f.id === farm.id);
    if (!farmOnGis) {
      throw new Error(`Farm ${farm.name} not found in GIS map data!`);
    }
    console.log(`    ✓ Confirmed: Farm verified on GIS layer at [${farmOnGis.latitude}, ${farmOnGis.longitude}].`);
  }

  // 4. RBAC Verification
  console.log('\n[4] Verifying RBAC Security (Farmer cannot access unauthorized animal location):');
  const farmerLogin = await request('POST', '/auth/login', {}, {
    username: 'test_farmer_a',
    password: 'hB5^nJ2$mD9@fX3*'
  });
  if (farmerLogin.status === 200 && farmerLogin.body.token) {
    const farmerToken = farmerLogin.body.token;
    // Attempt to access an animal owned by Farmer B
    const unauthorizedRes = await request('GET', '/animals/by-tag/VAC-TAG-B-1790206552019', {
      'Authorization': `Bearer ${farmerToken}`
    });
    if (unauthorizedRes.status === 404 || unauthorizedRes.status === 403) {
      console.log(`    ✓ Confirmed: Unauthorized farmer access to Farmer B's animal blocked with status ${unauthorizedRes.status}.`);
    } else {
      throw new Error(`Security breach: Farmer accessed unauthorized animal! Status: ${unauthorizedRes.status}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  ALL VETERINARIAN ANIMAL LOCATION TESTS PASSED');
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
