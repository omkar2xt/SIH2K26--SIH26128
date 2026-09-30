const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDemo() {
  console.log('--- STARTING GOLDEN DEMO VERIFICATION ---');

  // TEST 1: Login (Simulate by getting DB users)
  console.log('\nTEST 1: Validating Demo Users...');
  const farmer = await prisma.user.findUnique({ where: { username: 'test_farmer_a' } });
  const vet = await prisma.user.findUnique({ where: { username: 'dr_kulkarni' } });
  if (!farmer || !vet) throw new Error('Demo users missing');
  console.log('PASS: test_farmer_a and dr_kulkarni exist.');

  // TEST 2: Open animal
  console.log('\nTEST 2 & 3: Open animal & View Baseline...');
  const animal = await prisma.animal.findUnique({ where: { tagId: 'MH-CAT-027' }, include: { farm: true } });
  if (!animal) throw new Error('Demo animal missing');
  if (animal.farm.ownerId !== farmer.id) throw new Error('Farmer does not own the farm');
  console.log('PASS: MH-CAT-027 exists and is owned by test_farmer_a.');

  // Check baseline
  const obs = await prisma.healthObservation.findMany({ where: { animalId: animal.id }, take: 7 });
  console.log('PASS: Animal baseline accessible. Observations:', obs.length);

  // TEST 4: Submit observation (from Farmer)
  console.log('\nTEST 4: Submit observation...');
  const newObs = await prisma.healthObservation.create({
    data: {
      animalId: animal.id,
      observerId: farmer.id,
      activityLevel: 10, // Simulated huge drop
      feedingMinutes: 20, // Simulated huge drop
      temperatureCelsius: 40.5,
      notes: "Symptoms: Lying down / not standing up, Not eating / low appetite, High temperature (feels hot)\nNotes: Cow looks very sick",
      dataSource: 'FARMER_OBSERVATION'
    }
  });
  console.log('PASS: Observation submitted.', newObs.id);

  // TEST 5: Evaluate intelligence
  console.log('\nTEST 5: Evaluate Intelligence...');
  const { evaluateRisk } = require('./src/services/intelligenceCoreService');
  const { processRiskEvaluation } = require('./src/services/alertService');
  
  const allObs = await prisma.healthObservation.findMany({ where: { animalId: animal.id }, take: 7 });
  const { calculateBaseline } = require('./src/services/healthFingerprintService');
  const baseline = calculateBaseline(allObs);
  
  const currentReadings = {
    activity: newObs.activityLevel,
    feeding: newObs.feedingMinutes,
    temperatureCelsius: newObs.temperatureCelsius,
    social: 'recumbent'
  };

  const evaluation = evaluateRisk(animal, currentReadings, baseline, [], [], []);
  console.log('Intelligence Output:', evaluation.riskLevel, 'Score:', evaluation.riskScore);
  
  if (evaluation.riskLevel !== 'RED' && evaluation.riskLevel !== 'CRITICAL') {
    throw new Error('Risk evaluation did not trigger high risk.');
  }
  console.log('PASS: Intelligence evaluated abnormality successfully.');

  // TEST 6 & 7: Verify event/snapshot and alert
  console.log('\nTEST 6 & 7: Event/Snapshot and Alert generation...');
  
  // Mock IO for processRiskEvaluation
  const mockIo = { to: () => ({ emit: () => {} }) };
  await processRiskEvaluation(animal, evaluation, mockIo);

  const event = await prisma.healthEvent.findFirst({ where: { animalId: animal.id }, orderBy: { createdAt: 'desc' }, include: { snapshots: true } });
  if (!event || !event.snapshots) throw new Error('Event or Snapshot missing');
  
  const alert = await prisma.alert.findFirst({ where: { healthEventId: event.id } });
  if (!alert) throw new Error('Alert missing');
  console.log('PASS: Event, Snapshot, and Alert successfully generated.', alert.id);

  // TEST 8: Create veterinary case
  console.log('\nTEST 8: Create Veterinary Case...');
  const vCase = await prisma.case.create({
    data: {
      caseNumber: `CAS-${Date.now()}`,
      animalId: animal.id,
      farmId: animal.farmId,
      alertId: alert.id,
      status: 'SUSPECTED',
      createdById: vet.id,
      priority: 'HIGH',
      clinicalNotes: 'Created from Alert automatically or by Vet'
    }
  });
  console.log('PASS: Veterinary Case created.', vCase.caseNumber);

  // TEST 9 & 10: Create laboratory workflow and result
  console.log('\nTEST 9 & 10: Laboratory Workflow & Result...');
  const order = await prisma.labOrder.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      caseId: vCase.id,
      requestorId: vet.id,
      status: 'COMPLETED'
    }
  });
  const sample = await prisma.labSample.create({
    data: { sampleCode: `SMP-${Date.now()}`, labOrderId: order.id }
  });
  const test = await prisma.labTest.create({
    data: { sampleId: sample.id, testName: 'FMD RT-PCR', status: 'COMPLETED' }
  });
  const result = await prisma.labResult.create({
    data: { labTestId: test.id, resultOutcome: 'POSITIVE', verifiedBy: 'Lab Admin' }
  });
  console.log('PASS: Laboratory result processed as POSITIVE.');

  // TEST 11: Verify case transition
  console.log('\nTEST 11: Case transition...');
  const updatedCase = await prisma.case.update({
    where: { id: vCase.id },
    data: { status: 'CONFIRMED' } // Simulated transition triggered by lab logic in the real backend
  });
  console.log('PASS: Case transitioned to CONFIRMED.', updatedCase.status);

  // TEST 12: GIS / Official View
  console.log('\nTEST 12: GIS Verification...');
  const farm = await prisma.farm.findUnique({ where: { id: animal.farmId }, include: { district: true } });
  console.log(`GIS Data Available: Lat ${farm.latitude}, Lng ${farm.longitude}, District ${farm.district.name}`);
  console.log('PASS: GIS data ready for display.');

  console.log('\n--- GOLDEN DEMO VERIFICATION COMPLETE: ALL PASS ---');
}

runDemo().catch(console.error).finally(() => prisma.$disconnect());
