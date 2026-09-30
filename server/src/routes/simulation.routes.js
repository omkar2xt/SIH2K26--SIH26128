const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { evaluateRisk } = require('../services/intelligenceCoreService');
const { calculateBaseline } = require('../services/healthFingerprintService');
const { processRiskEvaluation } = require('../services/alertService');
const { generateCaseNumber, recordStatusHistory } = require('../services/caseService');
const { generateOrderNumber, generateSampleCode } = require('../services/labService');

router.post('/step', async (req, res) => {
  const { step } = req.body;

  try {
    const a027 = await prisma.animal.findUnique({ where: { tagId: 'MH-CAT-027' }, include: { farm: true } });
    const a031 = await prisma.animal.findUnique({ where: { tagId: 'MH-CAT-031' }, include: { farm: true } });
    const id027 = a027 ? a027.id : null;
    const id031 = a031 ? a031.id : null;
    
    // Find a vet user to assign
    const vetUser = await prisma.user.findFirst({ where: { role: { name: 'VETERINARIAN' } } });
    const vetId = vetUser ? vetUser.id : null;

    const adminUser = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });
    const observerId = adminUser ? adminUser.id : null;

    if (!observerId || !vetId) {
      return res.status(400).json({ success: false, error: 'Missing required users for simulation' });
    }

    if (id027) {
      let c = { activity: 88, feeding: 86, movement: 87, rumination: 83, tempTrend: 'normal', social: 'normal' };
      if (step >= 2)  { c.activity  = Math.max(10, c.activity  - 12); }
      if (step >= 3)  { c.feeding   = Math.max(10, c.feeding   - 15); }
      if (step >= 4)  { c.tempTrend = 'elevated'; }
      if (step >= 5)  { c.social    = 'isolating'; c.movement = Math.max(10, c.movement - 20); }
      if (step >= 6)  { c.activity = Math.max(10, c.activity - 10); }
      if (step >= 8)  { c.social    = 'recumbent'; c.feeding = Math.max(5, c.feeding - 10); }

      await prisma.healthObservation.create({
        data: {
          animalId: id027,
          dataSource: 'simulation',
          activityLevel: c.activity,
          feedingMinutes: c.feeding,
          movementMeters: c.movement,
          ruminationMinutes: c.rumination,
          notes: `Simulation Step ${step}`,
          observerId
        }
      });
      
      const recentObs = await prisma.healthObservation.findMany({ where: { animalId: id027 }, orderBy: { timestamp: 'desc' }, take: 7 });
      const baseline = calculateBaseline(recentObs);
      const diseases = await prisma.disease.findMany();
      const diseaseSpecies = await prisma.diseaseSpeciesAssociation.findMany();
      const exposureEvents = await prisma.exposureEvent.findMany({ where: { OR: [{ sourceId: id027 }, { targetId: id027 }] }, take: 100 });
      const evaluation = evaluateRisk(a027, c, baseline, diseases, exposureEvents, diseaseSpecies);
      await prisma.animal.update({ where: { id: id027 }, data: { riskLevel: evaluation.riskLevel } });
      await processRiskEvaluation(a027, evaluation, req.app.get('io'));

      if (step >= 11) {
        let simCase = await prisma.case.findFirst({ where: { animalId: id027 } });
        if (!simCase) {
          const alert = await prisma.alert.findFirst({ where: { animalTag: 'MH-CAT-027', status: 'OPEN' } });
          const caseNumber = await generateCaseNumber();
          const fmd = diseases.find(d => d.shortName === 'FMD');
          
          simCase = await prisma.case.create({
            data: {
              caseNumber,
              animalId: id027,
              farmId: a027.farmId,
              createdById: observerId,
              assignedVetId: vetId,
              alertId: alert ? alert.id : null,
              suspectedDiseaseId: fmd ? fmd.id : null,
              priority: 'HIGH',
              clinicalNotes: 'Simulation: FMD suspected. Field review initiated.',
              status: 'SUSPECTED'
            }
          });
          await recordStatusHistory(simCase.id, 'NONE', 'SUSPECTED', observerId, 'Case created');
        }

        if (step >= 12 && simCase.status === 'SUSPECTED') {
          simCase = await prisma.case.update({
            where: { id: simCase.id },
            data: {
              status: 'INVESTIGATING',
              clinicalNotes: simCase.clinicalNotes + '\n\nVesicular lesions on tongue and hooves. Drooling. Reduced mobility. Elevated temperature.'
            }
          });
          await recordStatusHistory(simCase.id, 'SUSPECTED', 'INVESTIGATING', vetId, 'Field review');
        }

        if (step >= 13) {
          let order = await prisma.labOrder.findFirst({ where: { caseId: simCase.id } });
          if (!order) {
            simCase = await prisma.case.update({
              where: { id: simCase.id },
              data: { status: 'LAB_PENDING' }
            });
            await recordStatusHistory(simCase.id, 'INVESTIGATING', 'LAB_PENDING', vetId, 'Lab order created');
            
            const orderNumber = await generateOrderNumber();
            const fmd = diseases.find(d => d.shortName === 'FMD');
            
            order = await prisma.labOrder.create({
              data: {
                orderNumber,
                caseId: simCase.id,
                requestorId: vetId,
                status: 'ORDERED',
                priority: 'URGENT',
                notes: 'Simulation: Suspected FMD. Please expedite.',
                samples: {
                  create: [{
                    sampleCode: await generateSampleCode(1),
                    animalId: id027,
                    collectedBy: 'Dr. A. Kulkarni',
                    tests: {
                      create: [{
                        testName: 'RT-PCR',
                        suspectedDiseaseId: fmd ? fmd.id : null,
                        resultStatus: 'PENDING'
                      }]
                    }
                  }]
                }
              }
            });
          }

          if (step >= 15) {
            order = await prisma.labOrder.findFirst({ where: { caseId: simCase.id }, include: { samples: { include: { tests: true } } } });
            if (order && order.samples.length > 0 && order.samples[0].tests.length > 0) {
              const test = order.samples[0].tests[0];
              if (test.resultStatus === 'PENDING') {
                await prisma.labTest.update({
                  where: { id: test.id },
                  data: {
                    resultStatus: 'POSITIVE',
                    remarks: 'Confirmed positive for FMD via RT-PCR.',
                    verifiedBy: 'Regional Disease Diagnostic Laboratory, Pune'
                  }
                });
                await prisma.labOrder.update({
                  where: { id: order.id },
                  data: { status: 'COMPLETED' }
                });
                // When a lab test goes positive, we should also transition the Case if it's LAB_PENDING
                simCase = await prisma.case.update({
                  where: { id: simCase.id },
                  data: { status: 'CONFIRMED' }
                });
                await recordStatusHistory(simCase.id, 'LAB_PENDING', 'CONFIRMED', observerId, 'Lab result positive');
              }
            }
          }
        }
      }
    }

    if (id031 && step >= 8) {
      let c2 = { activity: 88, feeding: 86, movement: 87, rumination: 83, tempTrend: 'normal', social: 'normal' };
      c2.activity  = Math.max(20, c2.activity  - 20);
      c2.feeding   = Math.max(20, c2.feeding   - 25);
      await prisma.healthObservation.create({
        data: {
          animalId: id031,
          dataSource: 'simulation',
          activityLevel: c2.activity,
          feedingMinutes: c2.feeding,
          movementMeters: c2.movement,
          ruminationMinutes: c2.rumination,
          notes: `Simulation Step ${step} (Secondary)`,
          observerId
        }
      });
      const recentObs = await prisma.healthObservation.findMany({ where: { animalId: id031 }, orderBy: { timestamp: 'desc' }, take: 7 });
      const baseline = calculateBaseline(recentObs);
      const diseases = await prisma.disease.findMany();
      const diseaseSpecies = await prisma.diseaseSpeciesAssociation.findMany();
      const exposureEvents = await prisma.exposureEvent.findMany({ where: { OR: [{ sourceId: id031 }, { targetId: id031 }] }, take: 100 });
      const evaluation = evaluateRisk(a031, c2, baseline, diseases, exposureEvents, diseaseSpecies);
      await prisma.animal.update({ where: { id: id031 }, data: { riskLevel: evaluation.riskLevel } });
      await processRiskEvaluation(a031, evaluation, req.app.get('io'));
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
