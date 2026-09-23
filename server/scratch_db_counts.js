const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const counts = {
    users: await prisma.user.count(),
    farms: await prisma.farm.count(),
    animals: await prisma.animal.count(),
    species: await prisma.species.count(),
    breeds: await prisma.breed.count(),
    diseases: await prisma.disease.count(),
    observations: await prisma.healthObservation.count(),
    alerts: await prisma.alert.count(),
    exposureEvents: await prisma.exposureEvent.count(),
    clusters: await prisma.cluster.count(),
    cases: await prisma.case.count(),
    labSamples: await prisma.labSample.count(),
    syncQueue: await prisma.syncQueue.count()
  };
  console.log(JSON.stringify(counts, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
