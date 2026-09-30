const BASE = 'http://localhost:3000/api';

async function apicall(endpoint, options, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + endpoint, { ...(options || {}), headers });
  const body = await res.json().catch(function() { return null; });
  return { status: res.status, ok: res.ok, body };
}

async function run() {
  // Login as admin to see all cases
  const adminR = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'Dev@1234' }) });
  const adminToken = adminR.body.token;
  
  const vetR = await apicall('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'dr_kulkarni', password: 'Dev@1234' }) });
  const vetToken = vetR.body.token;
  const vetId = vetR.body.user.id;
  console.log('Vet dr_kulkarni ID:', vetId);

  // Get all cases as admin
  const casesR = await apicall('/cases?page=1&pageSize=100', {}, adminToken);
  const cases = casesR.body;
  
  // Find MH-CAT-027 case
  const catCase = Array.isArray(cases) ? cases.find(function(c) { return c.animal && c.animal.tagId === 'MH-CAT-027'; }) : null;
  if (catCase) {
    console.log('\nMH-CAT-027 Case:');
    console.log('  caseNumber:', catCase.caseNumber);
    console.log('  status:', catCase.status);
    console.log('  priority:', catCase.priority);
    console.log('  assignedVetId:', catCase.assignedVetId || catCase.assignedVet);
    console.log('  animalTag:', catCase.animal && catCase.animal.tagId);
    console.log('  labOrders:', catCase.labOrders ? catCase.labOrders.length : 'N/A');

    // Verify full traceability via case detail
    const detailR = await apicall('/cases/' + catCase.id, {}, adminToken);
    const detail = detailR.body && detailR.body.data ? detailR.body.data : detailR.body;
    if (detail) {
      console.log('\nFull Case Detail:');
      console.log('  id:', detail.id);
      console.log('  status:', detail.status);
      console.log('  assignedVet:', detail.assignedVet ? detail.assignedVet.fullName : 'UNASSIGNED');
      console.log('  createdBy:', detail.createdBy ? detail.createdBy.fullName : 'N/A');
      console.log('  alertId:', detail.alertId);
      console.log('  labOrders:', detail.labOrders ? detail.labOrders.length : 0);
      if (detail.labOrders && detail.labOrders[0]) {
        var lo = detail.labOrders[0];
        console.log('    orderNumber:', lo.orderNumber);
        console.log('    status:', lo.status);
        if (lo.samples && lo.samples[0]) {
          console.log('    sampleCode:', lo.samples[0].sampleCode);
          if (lo.samples[0].tests && lo.samples[0].tests[0]) {
            console.log('    testName:', lo.samples[0].tests[0].testName);
            console.log('    testStatus:', lo.samples[0].tests[0].status);
            if (lo.samples[0].tests[0].results && lo.samples[0].tests[0].results[0]) {
              console.log('    labResult:', lo.samples[0].tests[0].results[0].resultOutcome);
            }
          }
        }
      }
      console.log('  history:', detail.history ? detail.history.length : 0, 'entries');
    }

    // Now assign the case to dr_kulkarni and verify vet can see it
    console.log('\n--- Assigning case to dr_kulkarni ---');
    const assignR = await apicall('/cases/' + catCase.id + '/assign', { method: 'PUT', body: JSON.stringify({ assignedVetId: vetId }) }, adminToken);
    console.log('Assign result:', assignR.status, JSON.stringify(assignR.body && assignR.body.data ? { status: assignR.body.data.status, assignedVet: assignR.body.data.assignedVet } : assignR.body));

    // Now vet should see the case
    const vetCasesR = await apicall('/cases?page=1&pageSize=100', {}, vetToken);
    const vetCases = vetCasesR.body;
    console.log('Vet cases after assign:', Array.isArray(vetCases) ? vetCases.length : 'N/A');
    if (Array.isArray(vetCases) && vetCases.length > 0) {
      var vc = vetCases.find(function(c) { return c.animal && c.animal.tagId === 'MH-CAT-027'; });
      if (vc) console.log('Vet sees MH-CAT-027 case: YES, status=' + vc.status);
    }
  } else {
    console.log('MH-CAT-027 case not found in admin view!');
    console.log('All cases:', JSON.stringify(cases && cases.map ? cases.map(function(c) { return { num: c.caseNumber, animal: c.animal && c.animal.tagId }; }) : cases));
  }
}

run().catch(function(e) { console.error('FATAL:', e); });
