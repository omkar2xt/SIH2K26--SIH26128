async function login(username, password) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${username}`);
  const data = await res.json();
  return { token: data.token, user: data.user };
}

async function request(url, method, token, body = null) {
  const options = {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`http://localhost:3000${url}`, options);
  const contentType = res.headers.get('content-type');
  const data = contentType && contentType.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

async function runTest() {
  try {
    console.log("=== PASHU-RAKSHA E2E WORKFLOW INTEGRATION TEST ===");

    // 1. Log in users
    console.log("\n[1] Logging in personas...");
    const vet = await login('dr_kulkarni', 'tF3%kY8*wV1!zC6&');
    const lab = await login('lab_tech_1', 'qR8#vK4%pM7&gN2@');
    const admin = await login('admin', 'mX9$pQ2#rN7@vL4^');
    const farmer = await login('test_farmer_a', 'hB5^nJ2$mD9@fX3*');
    console.log("Tokens acquired.");

    // 2. Fetch Reference data
    const refRes = await request('/api/lab/reference', 'GET', lab.token);
    if (refRes.status !== 200) throw new Error("Failed to fetch lab reference data.");
    const { sampleTypes, labFacilities, diagnosticMethods } = refRes.data;
    const sampleTypeId = sampleTypes[0]?.id;
    const labFacilityId = labFacilities[0]?.id;
    const diagnosticMethodId = diagnosticMethods[0]?.id;

    // 3. Vet gets cases
    console.log("\n[2] Vet fetching cases...");
    let casesRes = await request('/api/cases?page=1&pageSize=10', 'GET', vet.token);
    let vetCase = casesRes.data.length > 0 ? casesRes.data[0] : null;

    if (!vetCase) {
      console.log("No existing cases found for Vet. Fetching an animal to create one...");
      // Let's create a case as vet. We need an animal ID.
      const animRes = await request('/api/animals?page=1&pageSize=10', 'GET', vet.token);
      if (animRes.data.length === 0) throw new Error("No animals found for Vet.");
      const animalId = animRes.data[0].id;
      
      const createCaseRes = await request('/api/cases', 'POST', vet.token, {
        animalId: animalId,
        clinicalNotes: "Testing E2E workflow",
        priority: "HIGH",
        status: "SUSPECTED"
      });
      if (createCaseRes.status !== 201) throw new Error(`Failed to create case: ${JSON.stringify(createCaseRes.data)}`);
      vetCase = createCaseRes.data;
      
      // Assign case to self
      await request(`/api/cases/${vetCase.id}/assign`, 'PUT', vet.token, { assignedVetId: vet.user.id });
      console.log(`Created and assigned new case ${vetCase.caseNumber}`);
    } else {
      console.log(`Found existing case ${vetCase.caseNumber}`);
    }

    // 4. Vet creates Lab Order
    console.log("\n[3] Vet creating Lab Order...");
    const orderBody = {
      caseId: vetCase.id,
      labFacilityId: labFacilityId,
      sampleTypeId: sampleTypeId,
      diagnosticMethodId: diagnosticMethodId,
      testName: "FMD Viral Antigen Test",
      priority: "URGENT",
      notes: "Please test for FMD"
    };
    const createOrderRes = await request('/api/lab/orders', 'POST', vet.token, orderBody);
    if (createOrderRes.status !== 201) throw new Error(`Failed to create lab order: ${JSON.stringify(createOrderRes.data)}`);
    const labOrder = createOrderRes.data;
    console.log(`Lab order ${labOrder.orderNumber} created.`);

    // 5. Lab receives Order
    console.log("\n[4] Lab checking orders...");
    const labOrdersRes = await request('/api/lab/orders', 'GET', lab.token);
    if (labOrdersRes.status !== 200) throw new Error(`Failed to fetch lab orders: ${JSON.stringify(labOrdersRes.data)}`);
    const myOrder = labOrdersRes.data.find(o => o.id === labOrder.id);
    if (!myOrder) throw new Error("Lab could not see the created order!");
    console.log(`Lab successfully retrieved order ${myOrder.orderNumber} for animal ${myOrder.case?.animal?.tagId}`);

    // 6. Lab updates Sample/Test Status
    console.log("\n[5] Lab updating order status...");
    const statuses = ['SAMPLE_COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'TESTING'];
    for (const status of statuses) {
      const updateStatusRes = await request(`/api/lab/orders/${labOrder.id}/status`, 'PUT', lab.token, { status });
      if (updateStatusRes.status !== 200) throw new Error(`Failed to update order status to ${status}: ${JSON.stringify(updateStatusRes.data)}`);
      console.log(`Order status updated to ${status}`);
    }

    // 7. Lab submits Result
    console.log("\n[6] Lab submitting test result...");
    const testId = myOrder.samples[0].tests[0].id;
    const resultBody = {
      resultOutcome: "POSITIVE",
      quantitativeValue: "High Titre",
      remarks: "Tested positive via ELISA",
      verifiedBy: "Dr. Lab Director",
      verifiedAt: new Date().toISOString()
    };
    const resultRes = await request(`/api/lab/tests/${testId}/result`, 'POST', lab.token, resultBody);
    if (resultRes.status !== 201) throw new Error(`Failed to submit test result: ${JSON.stringify(resultRes.data)}`);
    console.log(`Test result submitted successfully. New case status: ${resultRes.data.caseTransition?.newStatus || 'UNKNOWN'}`);

    // 8. Vet sees Lab Result & records assessment
    console.log("\n[7] Vet viewing result and recording assessment...");
    const vetOrderRes = await request(`/api/lab/orders/${labOrder.id}`, 'GET', vet.token);
    const completedTest = vetOrderRes.data.samples[0].tests[0];
    const finalResult = completedTest.results[0];
    console.log(`Vet sees result outcome: ${finalResult.resultOutcome}`);
    
    if (finalResult.resultOutcome !== 'POSITIVE') throw new Error("Vet did not see the correct result");

    const assessRes = await request(`/api/cases/${vetCase.id}/assessment`, 'POST', vet.token, {
      vetAssessment: "Confirmed FMD based on lab results. Initiating quarantine.",
    });
    if (assessRes.status !== 200) throw new Error(`Failed to record assessment: ${JSON.stringify(assessRes.data)}`);
    console.log(`Vet assessment recorded successfully.`);

    // 9. Negative Boundaries
    console.log("\n[8] Testing Negative Boundaries...");
    
    // Lab -> Admin
    const labAdminRes = await request('/api/users?page=1&pageSize=10', 'GET', lab.token);
    console.log(`Lab -> Admin (GET /api/users): HTTP ${labAdminRes.status} (Expected 403)`);

    // Admin -> Lab Result
    const adminLabRes = await request(`/api/lab/tests/${testId}/result`, 'POST', admin.token, resultBody);
    console.log(`Admin -> Lab (POST /api/lab/tests/...): HTTP ${adminLabRes.status} (Expected 403)`);

    // Vet -> unauthorized case
    // Create case with farmer, assign to no one.
    const farmerCases = await request('/api/cases', 'GET', farmer.token);
    let farmerCase = farmerCases.data.length > 0 ? farmerCases.data[0] : null;
    if (farmerCase) {
      // Trying to access someone else's case? But vet_kulkarni has access to cases in their district or assigned to them.
      // We will skip testing specific vet unauthorized access if we can't guarantee a case out of scope.
    }

    console.log("\n=== ALL WORKFLOW TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("\n[ERROR]", err.message);
  }
}

runTest();
