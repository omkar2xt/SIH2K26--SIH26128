const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireRoles } = require('../middleware/rbac.middleware');
const { authenticateRequest } = require('../middleware/auth.middleware');
const { validateRequest, validateQuery, paginationSchema, verifyClusterSchema } = require('../validators/api.validators');

const prisma = new PrismaClient();
const router = express.Router();
router.use(authenticateRequest);

// GET /epidemiology/exposure
router.get('/exposure', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL', 'VETERINARIAN']), validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedQuery;
    
    // In a real system, you'd scope this by user's assigned districts, but for official/vet, we allow them to see it
    const exposures = await prisma.exposureEvent.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        source: { select: { tagId: true, farmId: true, riskLevel: true } },
        target: { select: { tagId: true, farmId: true, riskLevel: true } },
      }
    });

    res.json({ success: true, data: exposures });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /epidemiology/clusters
router.get('/clusters', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL', 'VETERINARIAN']), validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedQuery;
    
    const where = {};
    if (req.user.role === 'DISTRICT_OFFICIAL' && req.user.districtId) {
      where.districtId = req.user.districtId;
    }

    const clusters = await prisma.cluster.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        district: true,
        members: true,
        containment: true,
      }
    });

    res.json({ success: true, data: clusters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PUT /epidemiology/clusters/:id/verify
router.put('/clusters/:id/verify', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL']), validateRequest(verifyClusterSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, description, containmentRadiusKm } = req.body; // already validated by req.body assignment in middleware

    const cluster = await prisma.cluster.findUnique({ where: { id }, include: { containment: true, district: true } });
    if (!cluster) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Cluster not found' }});
    }

    if (req.user.role === 'DISTRICT_OFFICIAL' && req.user.districtId !== cluster.districtId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot verify cluster outside your district' }});
    }

    const updateData = { status };
    if (description) updateData.description = description;

    // Transaction to update cluster and optionally create/update containment zone
    await prisma.$transaction(async (tx) => {
      await tx.cluster.update({
        where: { id },
        data: updateData
      });

      if (status === 'CONFIRMED_OUTBREAK' && containmentRadiusKm) {
        // Need to calculate center lat/lng based on farms in cluster
        const members = await tx.clusterMember.findMany({ where: { clusterId: id }, include: { farm: true } });
        
        let avgLat = 0, avgLng = 0;
        let validFarms = 0;
        for (const m of members) {
          if (m.farm && m.farm.latitude && m.farm.longitude) {
            avgLat += m.farm.latitude;
            avgLng += m.farm.longitude;
            validFarms++;
          }
        }

        if (validFarms > 0) {
          avgLat /= validFarms;
          avgLng /= validFarms;

          if (cluster.containment) {
            await tx.containmentZone.update({
              where: { id: cluster.containment.id },
              data: { radiusKm: containmentRadiusKm, status: 'ACTIVE' }
            });
          } else {
            await tx.containmentZone.create({
              data: {
                clusterId: id,
                radiusKm: containmentRadiusKm,
                centerLat: avgLat,
                centerLng: avgLng,
                status: 'ACTIVE',
              }
            });
          }
        }
      } else if (status === 'CONTAINED' && cluster.containment) {
        await tx.containmentZone.update({
          where: { id: cluster.containment.id },
          data: { status: 'LIFTED' }
        });
      }
    });

    const updated = await prisma.cluster.findUnique({ where: { id }, include: { containment: true } });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

module.exports = router;
