const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDemo() {
  console.log('--- RESETTING GOLDEN DEMO FOR MH-CAT-027 ---');

  const animal = await prisma.animal.findUnique({
    where: { tagId: 'MH-CAT-027' },
    include: {
      cases: {
        include: {
          labOrders: { include: { samples: { include: { tests: { include: { results: true } }, custodyChain: true } } } },
          history: true,
          treatments: true
        }
      },
      healthEvents: {
        include: { snapshots: true, evidences: true, alerts: { include: { recipients: true, acknowledgements: true } } }
      },
      observations: true
    }
  });

  if (!animal) {
    console.error('Animal not found');
    process.exit(1);
  }

  // BOTTOM-UP DELETION
  console.log('1. Deleting Alerts, Snapshots, and Events...');
  for (const he of animal.healthEvents) {
    for (const al of he.alerts) {
      await prisma.alertRecipient.deleteMany({ where: { alertId: al.id } });
      await prisma.alertAcknowledgement.deleteMany({ where: { alertId: al.id } });
      await prisma.alert.delete({ where: { id: al.id } });
    }
    await prisma.eventSnapshot.deleteMany({ where: { eventId: he.id } });
    await prisma.eventEvidence.deleteMany({ where: { eventId: he.id } });
    await prisma.healthEvent.delete({ where: { id: he.id } });
  }

  // Standalone alerts
  const standaloneAlerts = await prisma.alert.findMany({ where: { animalTag: animal.tagId, healthEventId: null }});
  for (const al of standaloneAlerts) {
    await prisma.alertRecipient.deleteMany({ where: { alertId: al.id } });
    await prisma.alertAcknowledgement.deleteMany({ where: { alertId: al.id } });
    await prisma.alert.delete({ where: { id: al.id } });
  }

  console.log('2. Wiping existing abnormal observations...');
  await prisma.healthObservation.deleteMany({ where: { animalId: animal.id } });

  console.log('3. Seeding 3 healthy baseline observations...');
  const baseDate = new Date();
  baseDate.setHours(baseDate.getHours() - 72); // 3 days ago

  const farmerUser = await prisma.user.findUnique({ where: { username: 'test_farmer_a' }});
  for (let i = 0; i < 3; i++) {
    const ts = new Date(baseDate);
    ts.setHours(ts.getHours() + (i * 24)); // 1 per day

    await prisma.healthObservation.create({
      data: {
        animalId: animal.id,
        observerId: farmerUser.id,
        activityLevel: 82 + Math.floor(Math.random() * 5),
        feedingMinutes: 180 + Math.floor(Math.random() * 20),
        movementMeters: 1500 + Math.floor(Math.random() * 200),
        ruminationMinutes: 300 + Math.floor(Math.random() * 30),
        temperatureCelsius: 38.5,
        dataSource: 'IOT_SENSOR',
        timestamp: ts
      }
    });
  }

  console.log('4. Resetting animal risk level...');
  await prisma.animal.update({
    where: { id: animal.id },
    data: {
      riskLevel: 'GREEN',
      healthStatus: 'HEALTHY'
    }
  });

  console.log('RESET COMPLETE. Scenario is ready for SIH judges.');
  await prisma.$disconnect();
}

resetDemo().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
