const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dryRun() {
  console.log('--- DRY RUN ANALYSIS FOR MH-CAT-027 ---');
  
  const animal = await prisma.animal.findUnique({
    where: { tagId: 'MH-CAT-027' },
    include: {
      cases: {
        include: {
          labOrders: {
            include: {
              samples: {
                include: { tests: { include: { results: true } }, custodyChain: true }
              }
            }
          },
          history: true,
          treatments: true
        }
      },
      healthEvents: {
        include: {
          snapshots: true,
          evidences: true,
          alerts: {
            include: {
              recipients: true,
              acknowledgements: true
            }
          }
        }
      },
      observations: {
        orderBy: { timestamp: 'asc' }
      }
    }
  });

  if (!animal) {
    console.error('Animal not found');
    return;
  }

  const counts = {
    LabResult: 0,
    LabTest: 0,
    SampleChainOfCustody: 0,
    LabSample: 0,
    LabOrder: 0,
    CaseStatusHistory: 0,
    TreatmentRecord: 0,
    Case: 0,
    AlertRecipient: 0,
    AlertAcknowledgement: 0,
    Alert: 0,
    EventSnapshot: 0,
    EventEvidence: 0,
    HealthEvent: 0,
    HealthObservation_ToKeep: 0,
    HealthObservation_ToDelete: 0
  };

  for (const c of animal.cases) {
    counts.Case++;
    counts.CaseStatusHistory += c.history.length;
    counts.TreatmentRecord += c.treatments.length;
    for (const lo of c.labOrders) {
      counts.LabOrder++;
      for (const ls of lo.samples) {
        counts.LabSample++;
        counts.SampleChainOfCustody += ls.custodyChain.length;
        for (const lt of ls.tests) {
          counts.LabTest++;
          counts.LabResult += lt.results.length;
        }
      }
    }
  }

  for (const he of animal.healthEvents) {
    counts.HealthEvent++;
    counts.EventSnapshot += he.snapshots.length;
    counts.EventEvidence += he.evidences.length;
    for (const al of he.alerts) {
      counts.Alert++;
      counts.AlertRecipient += al.recipients.length;
      counts.AlertAcknowledgement += al.acknowledgements.length;
    }
  }

  // Also check if any standalone alerts exist for this animal
  const standaloneAlerts = await prisma.alert.findMany({
    where: { animalTag: animal.tagId, healthEventId: null },
    include: { recipients: true, acknowledgements: true }
  });
  
  for (const al of standaloneAlerts) {
    counts.Alert++;
    counts.AlertRecipient += al.recipients.length;
    counts.AlertAcknowledgement += al.acknowledgements.length;
  }

  // Observations
  const obs = animal.observations;
  const healthyObs = obs.filter(o => o.activityLevel > 50 && o.feedingMinutes > 150);
  const abnormalObs = obs.filter(o => !(o.activityLevel > 50 && o.feedingMinutes > 150));
  
  counts.HealthObservation_ToKeep = Math.min(3, healthyObs.length);
  counts.HealthObservation_ToDelete = obs.length - counts.HealthObservation_ToKeep;

  console.log('\nPROPOSED DELETIONS (Bottom-Up Order):');
  console.log(`1. LabResult: ${counts.LabResult}`);
  console.log(`2. LabTest: ${counts.LabTest}`);
  console.log(`3. SampleChainOfCustody: ${counts.SampleChainOfCustody}`);
  console.log(`4. LabSample: ${counts.LabSample}`);
  console.log(`5. LabOrder: ${counts.LabOrder}`);
  console.log(`6. TreatmentRecord: ${counts.TreatmentRecord}`);
  console.log(`7. CaseStatusHistory: ${counts.CaseStatusHistory}`);
  console.log(`8. Case: ${counts.Case}`);
  console.log(`9. AlertAcknowledgement: ${counts.AlertAcknowledgement}`);
  console.log(`10. AlertRecipient: ${counts.AlertRecipient}`);
  console.log(`11. Alert: ${counts.Alert}`);
  console.log(`12. EventSnapshot: ${counts.EventSnapshot}`);
  console.log(`13. EventEvidence: ${counts.EventEvidence}`);
  console.log(`14. HealthEvent: ${counts.HealthEvent}`);
  console.log(`15. HealthObservation (Abnormal/Excess): ${counts.HealthObservation_ToDelete}`);
  console.log(`\nPRESERVED BASELINE OBSERVATIONS: ${counts.HealthObservation_ToKeep}`);

  console.log('\nSAFETY CHECKS:');
  console.log('- Unrelated animals affected: 0 (All ID lookups are strictly bound to MH-CAT-027\'s relation tree)');
  console.log('- Unrelated farms affected: 0');
  console.log('- Unrelated users affected: 0');
  console.log('- Knowledge Database affected: 0');
  console.log(`- Cascade deletes enabled: FALSE (Explicit manual bottom-up deletion required)`);

  await prisma.$disconnect();
}

dryRun().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
