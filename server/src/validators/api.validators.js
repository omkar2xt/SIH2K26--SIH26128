const { z } = require('zod');

// Middleware to validate req.body against a given Zod schema
const validateRequest = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.body);
    req.body = validated; // Replace body with validated/stripped version
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: error.errors } });
  }
};

// Middleware to validate req.query
const validateQuery = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.query);
    req.validatedQuery = validated;
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request query', details: error.errors } });
  }
};

// Middleware to validate req.params
const validateParams = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.params);
    req.params = validated;
    next();
  } catch (error) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request params', details: error.errors } });
  }
};

// Common Schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

const idParamSchema = z.object({
  id: z.string().uuid()
});

// DTO Schemas
const createFarmSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  districtId: z.string().uuid(),
  villageId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  // Omit ownerId, tenantId, organizationId (server-controlled)
}).strict();

const createAnimalSchema = z.object({
  tagId: z.string().min(1),
  speciesId: z.string().uuid(),
  breedId: z.string().uuid().optional(),
  farmId: z.string().uuid(), // Required from client, but verified by server
  gender: z.enum(['MALE', 'FEMALE']),
  ageMonths: z.number().int().min(0),
  weightKg: z.number().positive().optional(),
  productionStage: z.string().optional(),
  healthStatus: z.string().optional(),
  // riskLevel is omitted explicitly to prevent mass-assignment injection
}).strict();

const createObservationSchema = z.object({
  animalId: z.string().uuid(),
  dataSource: z.string().optional(),
  activityLevel: z.number().optional(),
  feedingMinutes: z.number().optional(),
  movementMeters: z.number().optional(),
  ruminationMinutes: z.number().optional(),
  temperatureCelsius: z.number().optional(),
  notes: z.string().optional(),
  // Omit observerId, timestamp, etc. (server-controlled)
}).strict();

const createAlertSchema = z.object({
  title: z.string().min(1),
  severity: z.string().optional(),
  district: z.string().min(1),
  farmName: z.string().min(1),
  animalTag: z.string().min(1),
  diseaseName: z.string().optional(),
  recommendedAction: z.string().min(1),
  healthEventId: z.string().uuid().optional(),
}).strict();

const telemetrySchema = z.object({
  animalId: z.string().uuid(),
  sensorType: z.string().min(1),
  value: z.number(),
  timestamp: z.string().datetime().optional()
}).strict();

// ─────────────────────────────────────────────────────────────────────────────
// Case Schemas — Mass-Assignment Protection
// All server-controlled fields are deliberately excluded:
//   id, caseNumber, status, assignedVetId, createdById, createdAt, updatedAt,
//   tenantId, ownerId, diagnosis, confirmed, vetAssessmentAt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /cases — Manual case creation.
 * Client may only specify the animal, optional alert link, suspected disease,
 * priority, and initial clinical notes. Everything else is server-set.
 */
const createCaseSchema = z.object({
  animalId:          z.string().uuid(),
  alertId:           z.string().uuid().optional(),
  suspectedDiseaseId: z.string().uuid().optional(),
  priority:          z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  clinicalNotes:     z.string().max(4000).optional(),
}).strict();

/**
 * PUT /cases/:id/assign — Assign a veterinarian.
 * Client supplies only the target vet's user ID.
 * Backend verifies the target exists and has VETERINARIAN role.
 */
const assignCaseSchema = z.object({
  assignedVetId: z.string().uuid(),
}).strict();

/**
 * PUT /cases/:id/status — Advance case status.
 * Client supplies the new status. Backend enforces valid transitions.
 * Optional clinicalNotes can be appended (not overwritten to full history).
 */
const CASE_STATUS_ENUM = z.enum([
  'SUSPECTED', 'INVESTIGATING', 'LAB_PENDING', 'CONFIRMED', 'REJECTED', 'RESOLVED'
]);

const updateCaseStatusSchema = z.object({
  status:       CASE_STATUS_ENUM,
  clinicalNotes: z.string().max(4000).optional(),
}).strict();

/**
 * POST /cases/:id/assessment — Veterinarian clinical assessment.
 * Records the vet's clinical assessment text (distinct from Brain risk output).
 * CRITICAL: Does NOT accept status, confirmed, diagnosis, or any system field.
 * This is a veterinary assessment — NOT a laboratory-confirmed diagnosis.
 */
const vetAssessmentSchema = z.object({
  vetAssessment:     z.string().min(1).max(8000),
  suspectedDiseaseId: z.string().uuid().optional(), // vet may refine the suspected disease
}).strict();

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  paginationSchema,
  idParamSchema,
  createFarmSchema,
  createAnimalSchema,
  createObservationSchema,
  createAlertSchema,
  telemetrySchema,
  createCaseSchema,
  assignCaseSchema,
  updateCaseStatusSchema,
  vetAssessmentSchema,
  CASE_STATUS_ENUM,
};
