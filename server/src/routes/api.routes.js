const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const { authenticateRequest } = require('../middleware/auth.middleware');
const { requireRoles } = require('../middleware/rbac.middleware');
const { loginLimiter, apiLimiter } = require('../middleware/rateLimit.middleware');
const { 
  validateRequest, 
  validateQuery,
  validateParams,
  paginationSchema,
  idParamSchema,
  createFarmSchema, 
  createAnimalSchema, 
  createObservationSchema, 
  createAlertSchema,
  createCaseSchema,
  assignCaseSchema,
  updateCaseStatusSchema,
  vetAssessmentSchema,
} = require('../validators/api.validators');

const {
  validateStatusTransition,
  generateCaseNumber,
  getCaseResourceScope,
  getAuthorizedCase,
  verifyTargetIsVet,
  resolveAnimalFromAlert,
  hasActiveCaseForAnimal,
  recordStatusHistory,
  formatCaseResponse,
} = require('../services/caseService');
const { z } = require('zod');

const { calculateBaseline } = require('../services/healthFingerprintService');
const { evaluateRisk } = require('../services/intelligenceCoreService');
const { evaluateExposures } = require('../services/exposureEngineService');
const { detectClusters } = require('../services/clusterEngineService');
const { processRiskEvaluation } = require('../services/alertService');

// ----------------------------------------------------
// Health Check & Readiness
// ----------------------------------------------------
router.get('/health', async (req, res) => {
  try {
    // Basic liveness - don't hit DB to avoid leaking connection strings/Prisma errors on failure
    res.json({
      status: 'ok',
      service: 'PASHU-RAKSHA Production Backend',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({ success: false, error: { code: 'HEALTH_CHECK_FAILED', message: 'Service unavailable' } });
  }
});

// ----------------------------------------------------
// Auth & Users
// ----------------------------------------------------
router.get('/users', authenticateRequest, requireRoles(['ADMIN']), validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const users = await prisma.user.findMany({ 
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: { id: true, username: true, email: true, fullName: true, roleId: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

router.post('/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(401).json({ error: 'Username and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true },
  });
  
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, roleId: user.roleId, role: user.role.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// ----------------------------------------------------
// Protect all remaining routes
// ----------------------------------------------------
router.use(authenticateRequest);
// apply api limiter globally for all protected routes
router.use(apiLimiter);

// ----------------------------------------------------
// Master Data: Species, Breeds, Diseases
// ----------------------------------------------------
router.get('/species', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const species = await prisma.species.findMany({ 
    skip: (page - 1) * pageSize, take: pageSize, include: { breeds: true } 
  });
  res.json(species);
});

router.get('/breeds', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const breeds = await prisma.breed.findMany({ 
    skip: (page - 1) * pageSize, take: pageSize, include: { species: true } 
  });
  res.json(breeds);
});

router.get('/diseases', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const diseases = await prisma.disease.findMany({
    skip: (page - 1) * pageSize, take: pageSize
  });
  res.json(diseases);
});

// ----------------------------------------------------
// Operational Data: Farms & Animals
// ----------------------------------------------------
router.get('/farms', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  let whereClause = {};
  if (req.user.role === 'FARMER') {
    whereClause = { ownerId: req.user.userId };
  } else if (req.user.role === 'FIELD_WORKER') {
    whereClause = { ownerId: req.user.userId }; // strict
  }

  const farms = await prisma.farm.findMany({
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { animals: true, district: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(farms);
});

router.post('/farms', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL', 'FARMER']), validateRequest(createFarmSchema), async (req, res) => {
  const data = { ...req.body };
  if (req.user.role === 'FARMER') {
    data.ownerId = req.user.userId;
  }
  const farm = await prisma.farm.create({ data });
  res.json(farm);
});

router.get('/animals', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  let whereClause = {};
  if (req.user.role === 'FARMER') {
    whereClause = { farm: { ownerId: req.user.userId } };
  } else if (req.user.role === 'VETERINARIAN') {
    whereClause = { cases: { some: { assignedVetId: req.user.userId } } };
  } else if (req.user.role === 'FIELD_WORKER') {
    whereClause = { farm: { ownerId: req.user.userId } };
  }

  const animals = await prisma.animal.findMany({
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { species: true, breed: true, farm: true, observations: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(animals);
});

router.get('/animals/:id', validateParams(idParamSchema), async (req, res) => {
  let whereClause = { id: req.params.id };
  if (req.user.role === 'FARMER') {
    whereClause.farm = { ownerId: req.user.userId };
  } else if (req.user.role === 'VETERINARIAN') {
    whereClause.cases = { some: { assignedVetId: req.user.userId } };
  }

  const animal = await prisma.animal.findFirst({
    where: whereClause,
    include: { species: true, breed: true, farm: true, observations: true, healthEvents: true, riskAssessments: true },
  });
  if (!animal) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Animal not found or unauthorized' }});
  res.json(animal);
});

router.post('/animals', requireRoles(['FARMER', 'ADMIN', 'FIELD_WORKER']), validateRequest(createAnimalSchema), async (req, res) => {
  if (req.user.role === 'FARMER' || req.user.role === 'FIELD_WORKER') {
    const farm = await prisma.farm.findUnique({ where: { id: req.body.farmId } });
    if (!farm || farm.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized: Farm does not belong to you.' }});
    }
  }
  const animal = await prisma.animal.create({ data: req.body });
  res.json(animal);
});

// ----------------------------------------------------
// Health Observations & Intelligence Evaluation
// ----------------------------------------------------
router.get('/observations', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  let whereClause = {};
  if (req.user.role === 'FARMER') {
    whereClause = { animal: { farm: { ownerId: req.user.userId } } };
  }

  const obs = await prisma.healthObservation.findMany({
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { timestamp: 'desc' },
  });
  res.json(obs);
});

router.post('/observations', requireRoles(['FARMER', 'FIELD_WORKER', 'VETERINARIAN', 'ADMIN']), validateRequest(createObservationSchema), async (req, res) => {
  if (req.user.role === 'FARMER') {
    const animal = await prisma.animal.findUnique({ where: { id: req.body.animalId }, include: { farm: true } });
    if (!animal || animal.farm.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized: Animal does not belong to your farm.' }});
    }
  }

  const data = { ...req.body, observerId: req.user.userId };
  const obs = await prisma.healthObservation.create({ data });
  res.json(obs);
});

router.get('/health-fingerprint/:animalId', validateParams(z.object({ animalId: z.string().uuid() })), async (req, res) => {
  const obs = await prisma.healthObservation.findMany({
    where: { animalId: req.params.animalId },
    orderBy: { timestamp: 'desc' },
    take: 7, // Limit explicitly
  });

  const baseline = calculateBaseline(obs);
  res.json({ animalId: req.params.animalId, baseline, observationCount: obs.length });
});

router.post('/intelligence/evaluate', validateRequest(z.object({ animalId: z.string().uuid(), currentReadings: z.object({}).passthrough().optional() }).strict()), async (req, res) => {
  const { animalId, currentReadings } = req.body;
  
  let whereClause = { id: animalId };
  if (req.user.role === 'FARMER') {
    whereClause.farm = { ownerId: req.user.userId };
  }

  const animal = await prisma.animal.findFirst({ where: whereClause });
  if (!animal) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Animal not found or unauthorized' }});

  const obs = await prisma.healthObservation.findMany({ where: { animalId }, take: 7 });
  const baseline = calculateBaseline(obs);
  const diseases = await prisma.disease.findMany();
  const diseaseSpecies = await prisma.diseaseSpeciesAssociation.findMany();
  const exposureEvents = await prisma.exposureEvent.findMany({
    where: { OR: [{ sourceId: animalId }, { targetId: animalId }] },
    take: 100 // Safe limit
  });

  const evaluation = evaluateRisk(animal, currentReadings || {}, baseline, diseases, exposureEvents, diseaseSpecies);

  await prisma.animal.update({
    where: { id: animalId },
    data: { riskLevel: evaluation.riskLevel },
  });

  await processRiskEvaluation(animal, evaluation, req.app.get('io'));

  res.json(evaluation);
});

// ----------------------------------------------------
// Alerts, Exposure & Clusters
// ----------------------------------------------------
router.get('/alerts', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  
  let whereClause = {};
  if (req.user.role === 'FARMER') {
    const userAnimals = await prisma.animal.findMany({ where: { farm: { ownerId: req.user.userId } }, select: { id: true, tagId: true } });
    const tags = userAnimals.map(a => a.tagId || a.id);
    whereClause.animalTag = { in: tags };
  }

  const alerts = await prisma.alert.findMany({ 
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' } 
  });
  res.json(alerts);
});

router.put('/alerts/:id/acknowledge', validateParams(idParamSchema), async (req, res) => {
  const alertId = req.params.id;
  
  const alert = await prisma.alert.findUnique({ where: { id: alertId }});
  if (!alert) return res.status(404).json({ success: false, error: { message: 'Alert not found' }});

  if (req.user.role === 'FARMER') {
    const userAnimals = await prisma.animal.findMany({ where: { farm: { ownerId: req.user.userId } }, select: { id: true, tagId: true } });
    const tags = userAnimals.map(a => a.tagId || a.id);
    if (!tags.includes(alert.animalTag)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' }});
    }
  }

  const updatedAlert = await prisma.alert.update({
    where: { id: alertId },
    data: { status: 'ACKNOWLEDGED' }
  });

  await prisma.alertAcknowledgement.create({
    data: {
      alertId: alertId,
      userId: req.user.userId,
    }
  });

  res.json(updatedAlert);
});

router.post('/alerts', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL', 'VETERINARIAN']), validateRequest(createAlertSchema), async (req, res) => {
  const alert = await prisma.alert.create({ data: req.body });
  res.json(alert);
});

router.get('/exposure', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL', 'VETERINARIAN']), validateQuery(paginationSchema), async (req, res) => {
  // Normally exposure relies on full state, but we should bound it.
  const rawEvents = await prisma.exposureEvent.findMany({ take: 1000, orderBy: { createdAt: 'desc' } });
  const animals = await prisma.animal.findMany({ take: 1000 });
  const enriched = evaluateExposures(rawEvents, animals);
  res.json(enriched);
});

router.get('/clusters', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL']), validateQuery(paginationSchema), async (req, res) => {
  const animals = await prisma.animal.findMany({ take: 1000 });
  const farms = await prisma.farm.findMany({ take: 1000 });
  const clusters = detectClusters(animals, farms);
  res.json(clusters);
});

// ----------------------------------------------------
// Cases & Veterinary Workflow
// All routes: authenticated, RBAC, resource-level authorization, DTO-validated
// Medical authority: no route auto-confirms disease or generates clinical diagnosis
// ----------------------------------------------------

// GET /cases — List cases scoped to the authenticated user's role and resources
router.get('/cases', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const whereClause = getCaseResourceScope(req.user);

  const cases = await prisma.case.findMany({
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      animal:          { include: { species: true, farm: { include: { district: true } } } },
      farm:            { include: { district: true } },
      assignedVet:     { select: { id: true, fullName: true, username: true } },
      createdBy:       { select: { id: true, fullName: true, username: true } },
      alert:           { select: { id: true, title: true, severity: true, animalTag: true } },
      suspectedDisease: { select: { id: true, name: true, shortName: true } },
      history:         { orderBy: { changedAt: 'desc' }, take: 5 },
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(cases.map(formatCaseResponse));
});

// GET /cases/:id — Single case with full resource authorization
router.get('/cases/:id', validateParams(idParamSchema), async (req, res) => {
  const vetCase = await getAuthorizedCase(req.params.id, req.user);
  if (!vetCase) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found or unauthorized' } });
  }
  res.json(formatCaseResponse(vetCase));
});

// POST /cases — Manual case creation (vet, official, admin only)
router.post(
  '/cases',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  validateRequest(createCaseSchema),
  async (req, res) => {
    const { animalId, alertId, suspectedDiseaseId, priority, clinicalNotes } = req.body;

    // 1. Verify animal exists and requestor has access
    let animalWhereClause = { id: animalId };
    if (req.user.role === 'VETERINARIAN') {
      // Vet can create case for any animal they have been assigned a case for, or any animal (no prior restriction)
      // Allow: vet may initiate cases for animals they examine
    }
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: { farm: { include: { district: true } } }
    });
    if (!animal) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Animal not found' } });
    }

    // 2. Verify alertId exists if provided
    if (alertId) {
      const alert = await prisma.alert.findUnique({ where: { id: alertId } });
      if (!alert) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } });
      }
    }

    // 3. Deduplication: no duplicate active cases for same animal
    const isDuplicate = await hasActiveCaseForAnimal(animalId);
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CASE', message: 'An active case already exists for this animal. Resolve or reject the existing case first.' }
      });
    }

    // 4. Generate server-controlled case number
    const caseNumber = await generateCaseNumber();

    // 5. Create the case — server sets: caseNumber, status, createdById, farmId
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        animalId,
        farmId:           animal.farmId,
        createdById:      req.user.userId,
        alertId:          alertId || null,
        suspectedDiseaseId: suspectedDiseaseId || null,
        priority:         priority || 'HIGH',
        clinicalNotes:    clinicalNotes || null,
        status:           'SUSPECTED',   // always starts here — client cannot set this
      },
      include: {
        animal:           { include: { species: true, farm: { include: { district: true } } } },
        farm:             { include: { district: true } },
        createdBy:        { select: { id: true, fullName: true, username: true } },
        suspectedDisease: { select: { id: true, name: true, shortName: true } },
        alert:            { select: { id: true, title: true, severity: true, animalTag: true } },
      }
    });

    // 6. Record initial status history
    await recordStatusHistory(newCase.id, 'NONE', 'SUSPECTED', req.user.userId, 'Case created');

    res.status(201).json(formatCaseResponse(newCase));
  }
);

// POST /cases/from-alert/:alertId — Create a case directly from an alert
// NOTE: Route must be defined BEFORE /cases/:id to avoid :id matching "from-alert"
router.post(
  '/cases/from-alert/:alertId',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  validateParams(z.object({ alertId: z.string().uuid() })),
  async (req, res) => {
    const { alertId } = req.params;

    // 1. Resolve alert and its animal
    const resolved = await resolveAnimalFromAlert(alertId);
    if (!resolved) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Alert not found or animal tag cannot be resolved to a registered animal' }
      });
    }
    const { alert, animal } = resolved;

    // 2. Deduplication check
    const isDuplicate = await hasActiveCaseForAnimal(animal.id);
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CASE', message: 'An active case already exists for this animal' }
      });
    }

    // 3. Generate case number and create case
    const caseNumber = await generateCaseNumber();
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        animalId:    animal.id,
        farmId:      animal.farmId,
        createdById: req.user.userId,
        alertId:     alertId,
        // diseaseName from alert stored as clinicalNotes context — NOT a confirmed diagnosis
        clinicalNotes: alert.diseaseName
          ? `Risk assessment indicated potential disease risk: ${alert.diseaseName}. Veterinary review required. This is a system-generated risk assessment, not a clinical or laboratory-confirmed diagnosis.`
          : 'Veterinary review required based on system risk assessment.',
        priority: alert.severity === 'CRITICAL' ? 'URGENT' : alert.severity === 'RED' ? 'HIGH' : 'MEDIUM',
        status:   'SUSPECTED',
      },
      include: {
        animal:    { include: { species: true, farm: { include: { district: true } } } },
        farm:      { include: { district: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
        alert:     { select: { id: true, title: true, severity: true, animalTag: true } },
      }
    });

    await recordStatusHistory(newCase.id, 'NONE', 'SUSPECTED', req.user.userId, `Case created from alert ${alertId}`);

    res.status(201).json(formatCaseResponse(newCase));
  }
);

// PUT /cases/:id/assign — Assign a veterinarian to a case
router.put(
  '/cases/:id/assign',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  validateParams(idParamSchema),
  validateRequest(assignCaseSchema),
  async (req, res) => {
    const { id } = req.params;
    const { assignedVetId } = req.body;

    // CRITICAL: Farmers are blocked by requireRoles above.
    // Vets cannot assign to self via a case they don't have access to.
    // Self-assignment: allowed only if vet has access to this case or case is SUSPECTED.

    // 1. Verify target is a VETERINARIAN
    const vetCheck = await verifyTargetIsVet(assignedVetId);
    if (!vetCheck.valid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ASSIGNMENT', message: vetCheck.error } });
    }

    // 2. Prevent vet from assigning cases they can't access (unless they're admin/official)
    //    For a plain VET: they can self-assign to a SUSPECTED case, or reassign their own case
    let vetCase;
    if (req.user.role === 'VETERINARIAN') {
      // Allow if: case is currently unassigned (SUSPECTED) OR already assigned to this vet
      vetCase = await prisma.case.findFirst({
        where: {
          id,
          OR: [
            { assignedVetId: null },        // unassigned — any vet may self-assign
            { assignedVetId: req.user.userId } // their own case
          ]
        }
      });
      // Only allow self-assignment
      if (vetCase && assignedVetId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Veterinarians may only self-assign. Assigning to other vets requires DISTRICT_OFFICIAL, STATE_OFFICIAL, or ADMIN role.' }
        });
      }
    } else {
      vetCase = await prisma.case.findUnique({ where: { id } });
    }

    if (!vetCase) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found or unauthorized for assignment' } });
    }

    // 3. Perform assignment and advance status if still SUSPECTED
    const newStatus = vetCase.status === 'SUSPECTED' ? 'INVESTIGATING' : vetCase.status;
    const oldStatus = vetCase.status;

    const updated = await prisma.case.update({
      where: { id },
      data: {
        assignedVetId,
        status: newStatus,
      },
      include: {
        animal:      { include: { species: true } },
        assignedVet: { select: { id: true, fullName: true, username: true } },
        createdBy:   { select: { id: true, fullName: true, username: true } },
      }
    });

    if (oldStatus !== newStatus) {
      await recordStatusHistory(id, oldStatus, newStatus, req.user.userId, `Case assigned to vet ${vetCheck.vet.username}`);
    }

    res.json(formatCaseResponse(updated));
  }
);

// PUT /cases/:id/status — Advance case status (state machine enforced)
router.put(
  '/cases/:id/status',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  validateParams(idParamSchema),
  validateRequest(updateCaseStatusSchema),
  async (req, res) => {
    const { id } = req.params;
    const { status: newStatus, clinicalNotes } = req.body;

    // 1. Fetch and authorize
    const vetCase = await getAuthorizedCase(id, req.user);
    if (!vetCase) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found or unauthorized' } });
    }

    // 2. Validate transition
    const transition = validateStatusTransition(vetCase.status, newStatus);
    if (!transition.valid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_TRANSITION', message: transition.error } });
    }

    // 3. Update case
    const updateData = { status: newStatus };
    if (clinicalNotes) updateData.clinicalNotes = clinicalNotes;

    const updated = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        animal:      { include: { species: true } },
        assignedVet: { select: { id: true, fullName: true, username: true } },
      }
    });

    await recordStatusHistory(id, vetCase.status, newStatus, req.user.userId, clinicalNotes || null);

    res.json(formatCaseResponse(updated));
  }
);

// POST /cases/:id/assessment — Veterinarian clinical assessment
// MEDICAL AUTHORITY: This records a VETERINARY ASSESSMENT, not a confirmed clinical diagnosis.
// The system does not automatically confirm any disease based on Brain risk output.
router.post(
  '/cases/:id/assessment',
  requireRoles(['VETERINARIAN', 'ADMIN']),
  validateParams(idParamSchema),
  validateRequest(vetAssessmentSchema),
  async (req, res) => {
    const { id } = req.params;
    const { vetAssessment, suspectedDiseaseId } = req.body;

    // 1. Vet can only assess their assigned cases; admin can assess any
    const vetCase = await getAuthorizedCase(id, req.user);
    if (!vetCase) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found or unauthorized' } });
    }

    // 2. Vet must be assigned to this case
    if (req.user.role === 'VETERINARIAN' && vetCase.assignedVetId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the assigned veterinarian may record a clinical assessment' }
      });
    }

    // 3. Record assessment — does NOT change status or confirm disease
    const updateData = {
      vetAssessment,
      vetAssessmentAt: new Date(),
    };
    if (suspectedDiseaseId !== undefined) {
      // Vet may refine the suspected disease but this remains "suspected"
      updateData.suspectedDiseaseId = suspectedDiseaseId;
    }

    const updated = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        animal:           { include: { species: true } },
        assignedVet:      { select: { id: true, fullName: true, username: true } },
        suspectedDisease: { select: { id: true, name: true, shortName: true } },
      }
    });

    res.json(formatCaseResponse(updated));
  }
);

router.get('/lab/orders', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL', 'VETERINARIAN']), validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  let whereClause = {};
  if (req.user.role === 'VETERINARIAN') {
    whereClause = { requestorId: req.user.userId };
  }

  const orders = await prisma.labOrder.findMany({
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { samples: { include: { tests: true } }, case: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

// ----------------------------------------------------
// Devices & Sync Queue
// ----------------------------------------------------
router.get('/devices', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL']), validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const devices = await prisma.device.findMany({ 
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { sensors: true, farm: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(devices);
});

// Limit array size in Zod schema
const syncSchema = z.object({
  operations: z.array(z.object({
    id: z.string().optional(),
    entityName: z.string().optional(),
    actionType: z.string().optional(),
    payload: z.object({}).passthrough().optional()
  })).max(100) // limit array size to 100 items per request
}).strict();

router.post('/sync', requireRoles(['ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL']), validateRequest(syncSchema), async (req, res) => {
  const { operations } = req.body;
  const results = [];
  if (Array.isArray(operations)) {
    for (const op of operations) {
      const syncItem = await prisma.syncQueue.create({
        data: {
          clientRef: op.id || `SYNC_${Date.now()}`,
          entityName: op.entityName || 'UNKNOWN',
          actionType: op.actionType || 'CREATE',
          payloadJson: JSON.stringify(op.payload || {}),
          status: 'SYNCED',
          syncedAt: new Date(),
        },
      });
      results.push(syncItem);
    }
  }
  res.json({ status: 'ok', syncedCount: results.length, syncResults: results });
});

module.exports = router;
