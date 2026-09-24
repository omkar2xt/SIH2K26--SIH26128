const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireRoles } = require('../middleware/rbac.middleware');
const { authenticateRequest } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();
const router = express.Router();
router.use(authenticateRequest);

/**
 * GET /gis/map-data
 * Returns aggregated geo-fenced data (farms, animals, verified clusters, active containment zones).
 * Farmer: sees only their own farm/animals.
 * Vet/Official: sees data scoped to their assigned district(s) or state.
 */
router.get('/map-data', requireRoles(['FARMER', 'VETERINARIAN', 'FIELD_WORKER', 'ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL']), async (req, res) => {
  try {
    const user = req.user;
    
    // RBAC scoping
    const farmWhere = {};
    if (user.role === 'FARMER') {
      farmWhere.ownerId = user.userId;
    } else if (user.role === 'DISTRICT_OFFICIAL' && user.districtId) {
      farmWhere.districtId = user.districtId;
    }

    const farms = await prisma.farm.findMany({
      where: farmWhere,
      include: {
        district: true
      }
    });

    const farmIds = farms.map(f => f.id);
    const animals = await prisma.animal.findMany({
      where: {
        farmId: { in: farmIds }
      },
      select: {
        id: true,
        tagId: true,
        farmId: true,
        species: true,
        riskLevel: true,
      }
    });

    const clusterWhere = {};
    if (user.role === 'FARMER' || (user.role === 'DISTRICT_OFFICIAL' && user.districtId)) {
      const distinctDistricts = [...new Set(farms.map(f => f.districtId))];
      clusterWhere.districtId = { in: distinctDistricts };
    }

    const clusters = await prisma.cluster.findMany({
      where: clusterWhere,
      include: {
        containment: true,
        district: true
      }
    });

    res.json({
      success: true,
      data: {
        farms,
        animals,
        clusters
      }
    });
  } catch (error) {
    console.error('[GIS Route Error]', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch map data' } });
  }
});

module.exports = router;
