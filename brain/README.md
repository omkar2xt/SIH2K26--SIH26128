# PASHU-RAKSHA Brain Module Architecture

## Purpose
The `brain/` module is the **single source of truth** for all veterinary knowledge, individual health fingerprint calculations, evidence fusion, explainable risk scoring, exposure network tracing, spatial-temporal cluster detection, event snapshotting, and scientific data validation across the PASHU-RAKSHA platform.

---

## Core Principle
- **OBSERVE → DETECT → ASSESS → TRACE → VERIFY → ACT**
- **Risk ≠ Diagnosis.** The Brain performs risk triage and stratifies baseline anomalies; veterinarian and laboratory confirmation remain authoritative.

---

## Subsystem Structure

```
brain/
├── brain.config.ts            # Global configuration (versions, multipliers, feature flags)
├── index.ts                   # Public API entry point (analyzeAnimalHealth, assessDiseaseRisk, etc.)
│
├── contracts/                 # Shared TypeScript interfaces (brain, knowledge, evidence, risk)
├── knowledge/                 # 22 modular knowledge directories (species, breeds, diseases, etc.)
├── fingerprint/               # 7-day rolling individual baseline & deviation computation
├── reasoning/                 # Multi-modal evidence fusion & explainability generator
├── risk-engine/               # Risk stratification & KB disease ranking orchestrator
├── exposure/                  # Transmission-weighted contact graph & 72h district cluster engine
├── snapshot/                  # Event evidence snapshot builder
├── validation/                # Data quality & scientific consistency verification
├── models/                    # ML Model Registry foundation (EXPERIMENTAL -> PRODUCTION)
├── rules/                     # Categorized domain rule sets
├── learning/                  # Dataset & veterinary feedback collection foundation
├── simulation/                # Scenario & synthetic sensor stream generator
└── tests/                     # Automated unit tests for Brain components
```

---

## Data Flow & Integration

```
IoT / Camera / Field Observation
             ↓
        Backend API
             ↓
       Persist State
             ↓
        BRAIN MODULE (`brain/index.ts`)
       ├── calculateHealthFingerprint()
       ├── fuseEvidence()
       ├── assessDiseaseRisk()
       ├── runExposureEngine()
       └── runClusterEngine()
             ↓
   Return Risk Analysis Result
             ↓
    Backend Stores Result & Emits Socket Event
             ↓
     Frontend UI Renders Analysis & Maps
```

---

## How to Add Knowledge Safely

1. Navigate to `brain/knowledge/<module>/` (e.g., `diseases/`, `species/`, `breeds/`).
2. Add or update JSON data files adhering to the schema.
3. Run the validation audit: `node brain/validation/data-quality.ts` (or `node scripts/validation/validate_kb.cjs`).
4. Re-run `node server/prisma/seed.js` to update the relational database schema.
