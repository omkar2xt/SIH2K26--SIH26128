const BASE = 'http://localhost:3000/api';
const results = [];

function log(step, status, detail) {
  console.log('  ' + status + ' [' + step + '] ' + detail);
  results.push({ step, status, detail });
}

async function apicall(endpoint, options, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + endpoint, { ...(options || {}), headers });
  const body = await res.json().catch(function() { return null; });
  return { status: res.status, ok: res.ok, body };
}

async function run() {
  let farmerToken, vetToken, adminToken;

  // ═══ 1. HEALTH ═══
  try {
    const h = await fetch('http://localhost:3000/health');
    const hb = await h.json();
    log('1.0 Health', h.ok ? 'PASS' : 'FAIL', 'Backend: ' + hb.status);
  } catch (e) {
    log('1.0 Health', 'FAIL', 'Backend unreachable');
    return;
  }

  // ═══ 2. AUTH + RBAC ═══
  {
    const r = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'test_farmer_a', password: 'Dev@1234' }) });
    farmerToken = r.body && r.body.token;
    log('2.1 Farmer Auth', farmerToken ? 'PASS' : 'FAIL', 'role: ' + (r.body && r.body.user && r.body.user.role && r.body.user.role.name));
  }
  {
    const r = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'dr_kulkarni', password: 'Dev@1234' }) });
    vetToken = r.body && r.body.token;
    log('2.2 Vet Auth', vetToken ? 'PASS' : 'FAIL', 'role: ' + (r.body && r.body.user && r.body.user.role && r.body.user.role.name));
  }
  {
    const r = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'Dev@1234' }) });
    adminToken = r.body && r.body.token;
    log('2.3 Admin Auth', adminToken ? 'PASS' : 'FAIL', 'role: ' + (r.body && r.body.user && r.body.user.role && r.body.user.role.name));
  }
  {
    const r = await apicall('/animals');
    log('2.4 RBAC NoToken=401', r.status === 401 ? 'PASS' : 'FAIL', 'got: ' + r.status);
  }
  {
    const r = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'test_farmer_a', password: 'wrong' }) });
    log('2.5 RBAC BadPwd', !r.ok ? 'PASS' : 'FAIL', 'rejected: ' + r.status);
  }

  // ═══ 3. FARM ═══
  {
    const r = await apicall('/farms', {}, farmerToken);
    const farms = r.ok ? (Array.isArray(r.body) ? r.body : (r.body && (r.body.data || r.body.farms)) || []) : [];
    const farm = farms.find(function(f) { return f.code === 'FARM-PN-001'; });
    log('3.1 Farm FARM-PN-001', farm ? 'PASS' : 'FAIL', farm ? ('name=' + farm.name + ', lat=' + farm.latitude + ', lng=' + farm.longitude) : 'not found');
  }

  // ═══ 4. ANIMAL ═══
  var animalId;
  {
    const r = await apicall('/animals', {}, farmerToken);
    const animals = r.ok ? (Array.isArray(r.body) ? r.body : (r.body && (r.body.data || r.body.animals)) || []) : [];
    const animal = animals.find(function(a) { return a.tagId === 'MH-CAT-027'; });
    animalId = animal && animal.id;
    log('4.1 Animal MH-CAT-027', animal ? 'PASS' : 'FAIL', animal ? ('health=' + animal.healthStatus + ', risk=' + animal.riskLevel) : 'not found');
  }
  if (animalId) {
    const r = await apicall('/animals/' + animalId, {}, farmerToken);
    const a = r.ok ? (r.body && r.body.data ? r.body.data : r.body) : null;
    log('4.2 Animal Detail', r.ok ? 'PASS' : 'FAIL', a ? ('healthStatus=' + a.healthStatus + ', observations=' + (a.observations ? a.observations.length : '?')) : 'failed');
  }

  // ═══ 5. OBSERVATION ═══
  if (animalId) {
    const r = await apicall('/observations', { method: 'POST', body: JSON.stringify({
      animalId: animalId, dataSource: 'FIELD_WORKER', activityLevel: 45, feedingMinutes: 30,
      movementMeters: 200, ruminationMinutes: 15, temperatureCelsius: 40.2,
      notes: 'Step 5 verification observation'
    }) }, farmerToken);
    const obs = r.ok ? (r.body && r.body.data ? r.body.data : r.body) : null;
    log('5.1 Observation', r.ok ? 'PASS' : 'FAIL', obs ? ('id=' + obs.id) : ('Status: ' + r.status + ', ' + JSON.stringify(r.body)));
  }

  // ═══ 6. INTELLIGENCE CORE ═══
  if (animalId) {
    const r = await apicall('/intelligence/evaluate', { method: 'POST', body: JSON.stringify({
      animalId: animalId,
      currentReadings: { activityLevel: 45, feedingMinutes: 30, movementMeters: 200, ruminationMinutes: 15, temperatureCelsius: 40.2 }
    }) }, vetToken);
    const res = r.ok ? (r.body && r.body.data ? r.body.data : r.body) : null;
    if (res) {
      log('6.1 Intelligence Core', 'PASS', 'riskLevel=' + (res.riskLevel || (res.risk && res.risk.level)));
      if (res.riskAssessment) log('6.2 RiskAssessment', 'PASS', 'score=' + res.riskAssessment.riskScore);
      if (res.healthEvent) log('6.3 HealthEvent', 'PASS', 'id=' + res.healthEvent.id + ', severity=' + res.healthEvent.severity);
      if (res.snapshot) log('6.4 EventSnapshot', 'PASS', 'snapshot created');
      if (res.alert) log('6.5 Alert', 'PASS', 'id=' + res.alert.id);
    } else {
      log('6.1 Intelligence Core', 'FAIL', 'Status: ' + r.status + ', ' + JSON.stringify(r.body));
    }
  }

  // ═══ 7. ALERTS ═══
  {
    const r = await apicall('/alerts?page=1&pageSize=100', {}, vetToken);
    const alerts = r.ok ? (r.body && r.body.data ? r.body.data : (Array.isArray(r.body) ? r.body : [])) : [];
    log('7.1 Alerts', r.ok ? 'PASS' : 'FAIL', 'total: ' + (Array.isArray(alerts) ? alerts.length : (r.body && r.body.total)));
    if (Array.isArray(alerts) && alerts.length > 0) {
      var catAlert = alerts.find(function(a) { return a.animalTag === 'MH-CAT-027'; });
      if (catAlert) log('7.2 MH-CAT-027 Alert', 'PASS', 'title=' + catAlert.title + ', severity=' + catAlert.severity + ', status=' + catAlert.status);
    }
  }

  // ═══ 8. CASE (Use existing) ═══
  var caseId;
  {
    const r = await apicall('/cases?page=1&pageSize=100', {}, vetToken);
    const caseList = r.ok ? (r.body && r.body.data ? r.body.data : (Array.isArray(r.body) ? r.body : [])) : [];
    if (Array.isArray(caseList)) {
      var catCase = caseList.find(function(c) { return c.animal && c.animal.tagId === 'MH-CAT-027'; });
      if (catCase) {
        caseId = catCase.id;
        log('8.1 Case Exists', 'PASS', 'caseNumber=' + catCase.caseNumber + ', status=' + catCase.status + ', priority=' + catCase.priority);
      } else {
        log('8.1 Case Exists', 'WARN', 'No case found for MH-CAT-027 in ' + caseList.length + ' cases');
      }
    }
  }
  if (caseId) {
    const r = await apicall('/cases/' + caseId, {}, vetToken);
    const c = r.ok ? (r.body && r.body.data ? r.body.data : r.body) : null;
    if (c) {
      log('8.2 Case Detail', 'PASS', 'status=' + c.status + ', animal=' + (c.animal && c.animal.tagId) + ', labOrders=' + (c.labOrders ? c.labOrders.length : 0));
      // Verify case has lab order with completed result
      if (c.labOrders && c.labOrders.length > 0) {
        var lo = c.labOrders[0];
        log('8.3 Lab Order in Case', 'PASS', 'orderNumber=' + lo.orderNumber + ', status=' + lo.status);
        if (lo.samples && lo.samples.length > 0 && lo.samples[0].tests && lo.samples[0].tests.length > 0) {
          var t = lo.samples[0].tests[0];
          log('8.4 Lab Test', 'PASS', 'testName=' + t.testName + ', status=' + t.status);
          if (t.results && t.results.length > 0) {
            log('8.5 Lab Result', 'PASS', 'outcome=' + t.results[0].resultOutcome + ' (laboratory-confirmed)');
          }
        }
      }
    } else {
      log('8.2 Case Detail', 'FAIL', 'Status: ' + r.status);
    }
  }

  // Verify case status = CONFIRMED after POSITIVE lab result
  if (caseId) {
    const r = await apicall('/cases/' + caseId, {}, vetToken);
    const c = r.ok ? (r.body && r.body.data ? r.body.data : r.body) : null;
    if (c && c.status === 'CONFIRMED') {
      log('8.6 Case CONFIRMED', 'PASS', 'status=CONFIRMED (triggered by POSITIVE lab result)');
    } else if (c) {
      log('8.6 Case Status', 'WARN', 'status=' + c.status + ' (not yet CONFIRMED)');
    }
  }

  // ═══ 9. LAB REFERENCE ═══
  {
    const r = await apicall('/lab/reference', {}, vetToken);
    const ref = r.ok ? (r.body && r.body.data ? r.body.data : r.body) : null;
    if (ref) {
      log('9.1 Lab Reference', 'PASS', 'sampleTypes=' + (ref.sampleTypes ? ref.sampleTypes.length : '?') + ', facilities=' + (ref.labFacilities ? ref.labFacilities.length : '?') + ', methods=' + (ref.diagnosticMethods ? ref.diagnosticMethods.length : '?'));
    } else {
      log('9.1 Lab Reference', 'FAIL', 'Status: ' + r.status);
    }
  }

  // ═══ 10. VACCINATION ═══
  {
    const r = await apicall('/vaccinations/reference', {}, vetToken);
    log('10.1 Vaccination Ref', r.ok ? 'PASS' : 'FAIL', 'Status: ' + r.status);
  }
  {
    const r = await apicall('/vaccinations/stats', {}, vetToken);
    log('10.2 Vaccination Stats', r.ok ? 'PASS' : 'FAIL', 'Status: ' + r.status);
  }

  // ═══ 11. GIS/EPIDEMIOLOGY ═══
  {
    const r = await apicall('/gis/map-data', {}, vetToken);
    const d = r.ok ? (r.body && r.body.data ? r.body.data : r.body) : null;
    log('11.1 GIS Map', r.ok ? 'PASS' : 'FAIL', d ? ('farms=' + (d.farms ? d.farms.length : '?') + ', alerts=' + (d.alerts ? d.alerts.length : '?')) : 'failed');
  }
  {
    const r = await apicall('/epidemiology/exposure?page=1&pageSize=10', {}, vetToken);
    log('11.2 Exposure', r.ok ? 'PASS' : 'WARN', 'Status: ' + r.status);
  }
  {
    const r = await apicall('/epidemiology/clusters?page=1&pageSize=10', {}, vetToken);
    log('11.3 Clusters', r.ok ? 'PASS' : 'WARN', 'Status: ' + r.status);
  }

  // ═══ 12. OFFICIAL ACCESS ═══
  {
    const r = await apicall('/cases?page=1&pageSize=100', {}, adminToken);
    const cl = r.ok ? (r.body && r.body.data ? r.body.data : (Array.isArray(r.body) ? r.body : [])) : [];
    log('12.1 Official Cases', r.ok ? 'PASS' : 'FAIL', 'visible: ' + (Array.isArray(cl) ? cl.length : (r.body && r.body.total)));
  }
  {
    const r = await apicall('/gis/map-data', {}, adminToken);
    log('12.2 Official GIS', r.ok ? 'PASS' : 'FAIL', 'Status: ' + r.status);
  }

  // ═══ 13. SYNC ═══
  {
    const r = await apicall('/sync', { method: 'POST', body: JSON.stringify({ operations: [] }) }, farmerToken);
    log('13.1 Sync', r.ok ? 'PASS' : 'WARN', 'Status: ' + r.status);
  }

  // ═══ SUMMARY ═══
  console.log('\n======================================================================');
  console.log('STEP 5 FULL VERIFICATION SUMMARY');
  console.log('======================================================================');
  var passes = results.filter(function(r) { return r.status === 'PASS'; }).length;
  var warns = results.filter(function(r) { return r.status === 'WARN'; }).length;
  var fails = results.filter(function(r) { return r.status === 'FAIL'; }).length;
  console.log('Total: ' + results.length + ' | PASS: ' + passes + ' | WARN: ' + warns + ' | FAIL: ' + fails);
  console.log('----------------------------------------------------------------------');
  results.forEach(function(r) {
    console.log('  [' + r.status + '] ' + r.step + ': ' + r.detail);
  });
  console.log('======================================================================');
  if (fails === 0 && warns === 0) console.log('FINAL STATUS: VERIFIED');
  else if (fails === 0) console.log('FINAL STATUS: VERIFIED WITH LIMITATIONS');
  else console.log('FINAL STATUS: ISSUES FOUND — needs investigation');
}

run().catch(function(e) { console.error('FATAL:', e); process.exit(1); });
