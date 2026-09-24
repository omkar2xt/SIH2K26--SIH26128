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
  createLabOrderSchema,
  recordLabResultSchema,
  updateLabOrderStatusSchema,
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

const {
  generateOrderNumber,
  generateSampleCode,
  getLabOrderScope,
  getAuthorizedLabOrder,
  getAuthorizedLabTest,
  triggerCaseTransitionFromResult,
  validateOrderStatusTransition,
  formatLabOrderResponse,
} = require('../services/labService');

const { z } = require('zod');

const { calculateBaseline } = require('../services/healthFingerprintService');
const { evaluateRisk } = require('../services/intelligenceCoreService');
// removed old engine imports
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

router.post('/auth/login', async (req, res) => {
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

  const obs = await prisma.healthObservation.findMany({ where: { animalId }, orderBy: { timestamp: 'desc' }, take: 7 });
  const baseline = calculateBaseline(obs);
  
  let evaluationReadings = currentReadings || {};
  if (Object.keys(evaluationReadings).length === 0 && obs.length > 0) {
    const latest = obs[0];
    evaluationReadings = {
      activity: latest.activityLevel,
      feeding: latest.feedingMinutes,
      movement: latest.movementMeters,
      rumination: latest.ruminationMinutes,
      temperatureCelsius: latest.temperatureCelsius,
      social: latest.notes?.toLowerCase().includes('lying down') ? 'recumbent' : undefined
    };
  }
  const diseases = await prisma.disease.findMany();
  const diseaseSpecies = await prisma.diseaseSpeciesAssociation.findMany();
  const exposureEvents = await prisma.exposureEvent.findMany({
    where: { OR: [{ sourceId: animalId }, { targetId: animalId }] },
    take: 100 // Safe limit
  });

  const evaluation = evaluateRisk(animal, evaluationReadings, baseline, diseases, exposureEvents, diseaseSpecies);

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

// Removed /exposure and /clusters routes - moved to epidemiology.routes.js

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

// ─────────────────────────────────────────────────────────────────────────────
// Laboratory Workflow
// All routes: authenticated, RBAC, resource-level authorization, DTO-validated
//
// MEDICAL AUTHORITY SEPARATION:
//   Brain output   → clinicalNotes (risk context — not a diagnosis)
//   Vet assessment → vetAssessment (veterinary clinical findings)
//   Lab result     → LabResult.resultOutcome (laboratory test result)
//
// No route here auto-confirms disease or generates a diagnosis from Brain output.
// ─────────────────────────────────────────────────────────────────────────────

// GET /lab/reference — Reference data for dropdowns (SampleTypes, LabFacilities, DiagnosticMethods)
router.get('/lab/reference',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  async (req, res) => {
    const [sampleTypes, labFacilities, diagnosticMethods] = await Promise.all([
      prisma.sampleType.findMany({ orderBy: { name: 'asc' } }),
      prisma.labFacility.findMany({ orderBy: { name: 'asc' } }),
      prisma.diagnosticMethod.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.json({ sampleTypes, labFacilities, diagnosticMethods });
  }
);

// GET /lab/orders — List orders scoped to authenticated user's role/resources
router.get('/lab/orders', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const whereClause = getLabOrderScope(req.user);

  const orders = await prisma.labOrder.findMany({
    where: whereClause,
    skip:  (page - 1) * pageSize,
    take:  pageSize,
    include: {
      case:        { include: { animal: { include: { species: true } }, farm: { include: { district: true } } } },
      labFacility: { select: { id: true, name: true, code: true, accredited: true, district: true } },
      requestor:   { select: { id: true, fullName: true, username: true } },
      suspectedDisease: { select: { id: true, name: true, shortName: true } },
      samples: {
        include: {
          sampleType: { select: { id: true, name: true } },
          tests: {
            include: {
              diagnosticMethod: { select: { id: true, name: true, code: true, type: true } },
              results: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders.map(formatLabOrderResponse));
});

// GET /lab/orders/:id — Single order with full resource authorization
router.get('/lab/orders/:id', validateParams(idParamSchema), async (req, res) => {
  const order = await getAuthorizedLabOrder(req.params.id, req.user);
  if (!order) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lab order not found or unauthorized' } });
  }
  res.json(formatLabOrderResponse(order));
});

// POST /lab/orders — Create lab order atomically (Order + Sample + Test in one transaction)
router.post(
  '/lab/orders',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  validateRequest(createLabOrderSchema),
  async (req, res) => {
    const { caseId, labFacilityId, sampleTypeId, diagnosticMethodId, testName, suspectedDiseaseId, priority, collectedBy, notes } = req.body;

    // 1. Verify caseId exists and user has access (if provided)
    if (caseId) {
      const vetCase = await getAuthorizedCase(caseId, req.user);
      if (!vetCase) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Case not found or unauthorized' } });
      }
    }

    // 2. Verify labFacilityId if provided
    if (labFacilityId) {
      const facility = await prisma.labFacility.findUnique({ where: { id: labFacilityId } });
      if (!facility) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lab facility not found' } });
      }
    }

    // 3. Verify sampleTypeId if provided
    if (sampleTypeId) {
      const sampleType = await prisma.sampleType.findUnique({ where: { id: sampleTypeId } });
      if (!sampleType) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sample type not found' } });
      }
    }

    // 4. Verify diagnosticMethodId if provided
    if (diagnosticMethodId) {
      const method = await prisma.diagnosticMethod.findUnique({ where: { id: diagnosticMethodId } });
      if (!method) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Diagnostic method not found' } });
      }
    }

    // 5. Generate server-controlled codes
    const orderNumber = await generateOrderNumber();
    const sampleCode  = await generateSampleCode();

    // 6. Atomic creation: Order → Sample → Test
    const newOrder = await prisma.labOrder.create({
      data: {
        orderNumber,
        caseId:            caseId            || null,
        labFacilityId:     labFacilityId     || null,
        requestorId:       req.user.userId,             // server-set
        suspectedDiseaseId: suspectedDiseaseId || null,
        priority:          priority === 'URGENT' ? 'URGENT' : 'ROUTINE',
        status:            'ORDERED',                   // always starts here — client cannot set
        samples: {
          create: {
            sampleCode,
            sampleTypeId: sampleTypeId || null,
            collectedAt:  new Date(),
            collectedBy:  collectedBy || req.user.username,
            tests: {
              create: {
                testName,
                diagnosticMethodId: diagnosticMethodId || null,
                status: 'PENDING',
              }
            }
          }
        }
      },
      include: {
        case:        { include: { animal: { include: { species: true } }, farm: { include: { district: true } } } },
        labFacility: { select: { id: true, name: true, code: true, accredited: true, district: true } },
        requestor:   { select: { id: true, fullName: true, username: true } },
        suspectedDisease: { select: { id: true, name: true, shortName: true } },
        samples: {
          include: {
            sampleType: { select: { id: true, name: true } },
            tests: { include: { diagnosticMethod: { select: { id: true, name: true, code: true, type: true } }, results: true } }
          }
        }
      }
    });

    res.status(201).json(formatLabOrderResponse(newOrder));
  }
);

// PUT /lab/orders/:id/status — Advance order through status state machine
router.put(
  '/lab/orders/:id/status',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  validateParams(idParamSchema),
  validateRequest(updateLabOrderStatusSchema),
  async (req, res) => {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    const order = await getAuthorizedLabOrder(id, req.user);
    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lab order not found or unauthorized' } });
    }

    const transition = validateOrderStatusTransition(order.status, newStatus);
    if (!transition.valid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_TRANSITION', message: transition.error } });
    }

    const updated = await prisma.labOrder.update({
      where: { id },
      data:  { status: newStatus },
      include: {
        case:        { include: { animal: true } },
        labFacility: { select: { id: true, name: true, code: true } },
        samples:     { include: { sampleType: true, tests: { include: { results: true } } } }
      }
    });

    res.json(formatLabOrderResponse(updated));
  }
);

// GET /lab/tests/:testId/result — Get result for a specific test
router.get('/lab/tests/:testId/result',
  validateParams(z.object({ testId: z.string().uuid() })),
  async (req, res) => {
    const { testId } = req.params;
    const test = await getAuthorizedLabTest(testId, req.user);
    if (!test) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lab test not found or unauthorized' } });
    }
    res.json({
      testId:          test.id,
      testName:        test.testName,
      status:          test.status,
      diagnosticMethod: test.diagnosticMethod || null,
      // NOTE: results are LABORATORY RESULTS — not Brain risk outputs or vet assessments
      results: (test.results || []).map(r => ({
        id:                r.id,
        resultOutcome:     r.resultOutcome,
        quantitativeValue: r.quantitativeValue,
        remarks:           r.remarks,
        verifiedBy:        r.verifiedBy,
        verifiedAt:        r.verifiedAt,
        createdAt:         r.createdAt,
        _authority:        'LABORATORY_RESULT',
      }))
    });
  }
);

// POST /lab/tests/:testId/result — Record a laboratory result
// MEDICAL AUTHORITY: This is a LABORATORY RESULT — not a Brain risk output or vet assessment.
// Recording a POSITIVE result on a LAB_PENDING case → CONFIRMED
// Recording a NEGATIVE result on a LAB_PENDING case → REJECTED
// Recording an INCONCLUSIVE result → no automatic case transition (vet review required)
router.post(
  '/lab/tests/:testId/result',
  requireRoles(['VETERINARIAN', 'DISTRICT_OFFICIAL', 'STATE_OFFICIAL', 'ADMIN']),
  validateParams(z.object({ testId: z.string().uuid() })),
  validateRequest(recordLabResultSchema),
  async (req, res) => {
    const { testId } = req.params;
    const { resultOutcome, quantitativeValue, remarks, verifiedBy, verifiedAt } = req.body;

    // 1. Fetch and authorize
    const test = await getAuthorizedLabTest(testId, req.user);
    if (!test) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lab test not found or unauthorized' } });
    }

    // 2. Prevent duplicate result submission
    if (test.results && test.results.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESULT',
          message: 'A result already exists for this test. Duplicate result submission is not permitted. Contact your administrator if a correction is required.',
          existingResultId: test.results[0].id,
        }
      });
    }

    // 3. Create the result — labTestId from URL param (client cannot inject)
    const result = await prisma.labResult.create({
      data: {
        labTestId:         testId,             // server-set from URL, not client body
        resultOutcome,                          // POSITIVE / NEGATIVE / INCONCLUSIVE
        quantitativeValue: quantitativeValue || null,
        remarks:           remarks           || null,
        verifiedBy:        verifiedBy        || null,
        verifiedAt:        verifiedAt ? new Date(verifiedAt) : null,
      }
    });

    // 4. Mark test as COMPLETED
    await prisma.labTest.update({
      where: { id: testId },
      data:  { status: 'COMPLETED' }
    });

    // 5. Trigger case transition (server-enforced state machine, not client-driven)
    const caseId = test.sample?.labOrder?.caseId;
    const transitionResult = await triggerCaseTransitionFromResult(caseId, resultOutcome, req.user.userId);

    res.status(201).json({
      result: {
        id:                result.id,
        resultOutcome:     result.resultOutcome,
        quantitativeValue: result.quantitativeValue,
        remarks:           result.remarks,
        verifiedBy:        result.verifiedBy,
        verifiedAt:        result.verifiedAt,
        createdAt:         result.createdAt,
        _authority:        'LABORATORY_RESULT',  // explicit medical authority label
      },
      caseTransition: transitionResult,
    });
  }
);

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
    id: z.string().uuid("Invalid localOperationId"),
    entityName: z.string(),
    actionType: z.string(),
    payload: z.object({}).passthrough()
  })).max(100) // bounded batch
}).strict();

router.post('/sync', requireRoles(['FARMER', 'FIELD_WORKER', 'VETERINARIAN', 'ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL']), validateRequest(syncSchema), async (req, res) => {
  const { operations } = req.body;
  const results = [];

  for (const op of operations) {
    let syncResult = { clientRef: op.id, status: 'FAILED' };

    try {
      // 1. Check Idempotency
      const existing = await prisma.syncQueue.findUnique({ where: { clientRef: op.id } });
      if (existing) {
        results.push({ clientRef: op.id, status: existing.status, message: 'Already processed' });
        continue;
      }

      // 2. Process based on entity
      if (op.entityName === 'observation' && op.actionType === 'CREATE') {
        const payload = createObservationSchema.parse(op.payload);
        
        // RBAC / Resource Auth Check
        if (req.user.role === 'FARMER') {
          const animal = await prisma.animal.findUnique({ where: { id: payload.animalId }, include: { farm: true } });
          if (!animal || animal.farm.ownerId !== req.user.userId) {
            throw new Error('Unauthorized: Animal does not belong to your farm.');
          }
        }
        
        // Strip out server-authoritative fields injection attempts
        const data = { ...payload, observerId: req.user.userId };
        delete data.tenantId; // don't let client set tenant
        delete data.ownerId;  // don't let client set owner

        // 3. Persist in transaction
        const result = await prisma.$transaction(async (tx) => {
          const obs = await tx.healthObservation.create({ data });
          const sq = await tx.syncQueue.create({
            data: {
              clientRef: op.id,
              entityName: 'observation',
              actionType: 'CREATE',
              payloadJson: JSON.stringify(op.payload),
              status: 'SYNCED',
              syncedAt: new Date(),
            }
          });
          return sq;
        });
        syncResult = { clientRef: op.id, status: result.status };
      } else {
        throw new Error('Unsupported entity or action for offline sync');
      }
    } catch (error) {
      // Record failure in DB to avoid retrying bad payloads indefinitely
      try {
        await prisma.syncQueue.create({
          data: {
            clientRef: op.id,
            entityName: op.entityName || 'UNKNOWN',
            actionType: op.actionType || 'UNKNOWN',
            payloadJson: JSON.stringify(op.payload || {}),
            status: 'FAILED',
          }
        });
      } catch(e) {}
      syncResult = { clientRef: op.id, status: 'FAILED', error: error.message };
    }
    results.push(syncResult);
  }

  res.json({ status: 'ok', syncedCount: results.filter(r => r.status === 'SYNCED').length, syncResults: results });
});

// ----------------------------------------------------
// Vaccination Workflow (STEP 2J)
// ----------------------------------------------------
const { getVaccinationScope, getAuthorizedAnimal, calculateCoverageStats } = require('../services/vaccinationService');
const { createVaccinationSchema } = require('../validators/api.validators');

router.get('/vaccinations/reference', async (req, res) => {
  const vaccines = await prisma.vaccine.findMany({
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data: vaccines });
});

router.get('/vaccinations/stats', async (req, res) => {
  try {
    const stats = await calculateCoverageStats(req.user);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.get('/vaccinations', validateQuery(paginationSchema), async (req, res) => {
  const { page, pageSize } = req.validatedQuery;
  const scope = getVaccinationScope(req.user);
  const records = await prisma.vaccinationRecord.findMany({
    where: scope,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      vaccine: true,
      animal: { select: { id: true, species: true } }
    },
    orderBy: { administeredAt: 'desc' }
  });
  res.json({ success: true, data: records });
});

router.post('/vaccinations', requireRoles(['FARMER', 'VETERINARIAN', 'FIELD_WORKER', 'ADMIN', 'STATE_OFFICIAL', 'DISTRICT_OFFICIAL']), validateRequest(createVaccinationSchema), async (req, res) => {
  try {
    const { animalId, ...rest } = req.body;
    
    // 1. Authorize animal
    const animal = await getAuthorizedAnimal(animalId, req.user);
    if (!animal) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Animal not found or unauthorized' }});
    }

    // 2. Prevent exact duplicate (same animal, same vaccine, same date)
    const exactDup = await prisma.vaccinationRecord.findFirst({
      where: {
        animalId,
        vaccineName: rest.vaccineName,
        administeredAt: rest.administeredAt ? new Date(rest.administeredAt) : new Date(),
      }
    });
    if (exactDup) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_VACCINATION', message: 'This exact vaccination was already recorded today.' }});
    }

    // 3. Create record
    const record = await prisma.vaccinationRecord.create({
      data: {
        animalId,
        vaccineId: rest.vaccineId,
        vaccineName: rest.vaccineName,
        administeredAt: rest.administeredAt ? new Date(rest.administeredAt) : new Date(),
        nextDueDate: rest.nextDueDate ? new Date(rest.nextDueDate) : null,
        batchNumber: rest.batchNumber,
        administeredBy: rest.administeredBy || req.user.username,
      },
      include: {
        vaccine: true
      }
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

module.exports = router;
