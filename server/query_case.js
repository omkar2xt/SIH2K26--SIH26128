const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Get case for MH-CAT-027
  const cases = await p.case.findMany({
    where: { animal: { tagId: 'MH-CAT-027' } },
    select: {
      id: true, caseNumber: true, status: true, priority: true,
      animalId: true, alertId: true,
      labOrders: {
        select: {
          id: true, orderNumber: true, status: true,
          samples: {
            select: {
              id: true, sampleCode: true,
              tests: {
                select: {
                  id: true, testName: true, status: true,
                  results: { select: { id: true, resultOutcome: true, remarks: true } }
                }
              }
            }
          }
        }
      }
    }
  });
  console.log('Cases for MH-CAT-027:', JSON.stringify(cases, null, 2));

  // Get fingerprint
  const fp = await p.healthFingerprint.findMany({
    where: { animal: { tagId: 'MH-CAT-027' } },
    select: {
      id: true, baselineActivity: true, baselineFeeding: true,
      baselineMovement: true, baselineRumination: true
    }
  });
  console.log('Fingerprints:', JSON.stringify(fp, null, 2));

  // Get health events
  const he = await p.healthEvent.findMany({
    where: { animal: { tagId: 'MH-CAT-027' } },
    select: { id: true, severity: true, summary: true, snapshots: { select: { id: true } }, alerts: { select: { id: true, title: true, status: true } } }
  });
  console.log('Health Events:', JSON.stringify(he, null, 2));

  // Get all alerts for MH-CAT-027
  const alerts = await p.alert.findMany({
    where: { animalTag: 'MH-CAT-027' },
    select: { id: true, title: true, severity: true, status: true, healthEventId: true }
  });
  console.log('Alerts:', JSON.stringify(alerts, null, 2));

  await p.$disconnect();
}

main().catch(async e => { console.error(e); await p.$disconnect(); process.exit(1); });
