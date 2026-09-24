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

// ─────────────────────────────────────────────────────────────────────────────
// Laboratory Schemas — Mass-Assignment Protection
// All server-controlled fields are deliberately excluded:
//   id, orderNumber, sampleCode, status, requestorId, createdAt, updatedAt,
//   caseStatus, confirmed, tenantId, ownerId, labTestId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /lab/orders — Create a lab order (atomically creates Order + Sample + Test).
 * Client may specify: case link, facility, sample type, test method, priority, disease.
 * Server controls: orderNumber, sampleCode, status, requestorId, createdAt.
 * CRITICAL: No field here may set case status or confirm a disease.
 */
const createLabOrderSchema = z.object({
  caseId:             z.string().uuid().optional(),
  labFacilityId:      z.string().uuid().optional(),
  sampleTypeId:       z.string().uuid().optional(),
  diagnosticMethodId: z.string().uuid().optional(),
  testName:           z.string().min(1).max(200),          // e.g. "RT-PCR"
  suspectedDiseaseId: z.string().uuid().optional(),
  priority:           z.enum(['ROUTINE', 'URGENT']).optional(),
  collectedBy:        z.string().max(200).optional(),       // field collector name/ID
  notes:              z.string().max(2000).optional(),
}).strict();

/**
 * POST /lab/tests/:testId/result — Record a laboratory test result.
 * Client may specify: resultOutcome, quantitativeValue, remarks, verifiedBy.
 * Server controls: id, labTestId (from URL param), createdAt.
 * CRITICAL: Does NOT accept caseId, animalId, confirmed, caseStatus, tenantId.
 * This is a LABORATORY RESULT — not a Brain risk output or veterinary assessment.
 */
const RESULT_OUTCOME_ENUM = z.enum(['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE']);

const recordLabResultSchema = z.object({
  resultOutcome:     RESULT_OUTCOME_ENUM,
  quantitativeValue: z.string().max(500).optional(),   // e.g. "Ct value: 28.5"
  remarks:           z.string().max(4000).optional(),  // lab technician notes
  verifiedBy:        z.string().max(200).optional(),   // name/ID of verifying authority
  verifiedAt:        z.string().datetime().optional(), // ISO timestamp of verification
}).strict();

/**
 * PUT /lab/orders/:id/status — Advance order status along state machine.
 * Server enforces valid transitions (ORDERED→SAMPLE_COLLECTED→...→COMPLETED).
 * Client may supply only the new status.
 */
const LAB_ORDER_STATUS_ENUM = z.enum([
  'ORDERED', 'SAMPLE_COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'TESTING', 'COMPLETED'
]);

const updateLabOrderStatusSchema = z.object({
  status: LAB_ORDER_STATUS_ENUM,
}).strict();

/**
 * POST /vaccinations — Create a vaccination record.
 * Client may specify: animalId, vaccineId, vaccineName, date, nextDue, batchNo, administeredBy, notes.
 * Server controls: id, createdBy, createdAt, updatedAt, tenantId, etc.
 * CRITICAL: This is a preventive health record, it does not confirm immunity or change Brain risk.
 */
const createVaccinationSchema = z.object({
  animalId:       z.string().uuid(),
  vaccineId:      z.string().uuid().optional(),
  vaccineName:    z.string().min(1).max(200),
  administeredAt: z.string().datetime().optional(), // ISO string, defaults to now if omitted
  nextDueDate:    z.string().datetime().optional(),
  batchNumber:    z.string().max(100).optional(),
  administeredBy: z.string().max(200).optional(),
  notes:          z.string().max(2000).optional(),
}).strict();

const verifyClusterSchema = z.object({
  status: z.enum(['POTENTIAL_CLUSTER', 'CONFIRMED_OUTBREAK', 'CONTAINED']),
  description: z.string().optional(),
  containmentRadiusKm: z.number().min(0).max(50).optional(),
}).strict();

module.exports = {
  verifyClusterSchema,
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
  createLabOrderSchema,
  recordLabResultSchema,
  updateLabOrderStatusSchema,
  RESULT_OUTCOME_ENUM,
  LAB_ORDER_STATUS_ENUM,
  createVaccinationSchema,
};

