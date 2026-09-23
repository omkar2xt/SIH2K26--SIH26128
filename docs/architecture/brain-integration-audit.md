# PASHU-RAKSHA — Brain Module Integration Audit
**Date:** September 17, 2026  
**Version:** 1.0.0  
**Project:** PASHU-RAKSHA (SIH26128)

---

## 1. Executive Summary

This audit assesses the existing PASHU-RAKSHA repository prior to adding and integrating the top-level `brain/` module. The project already possesses working intelligence calculations in `src/engine/` (frontend in-browser engine) and `server/src/services/` (backend Node.js services), as well as a 22-directory `knowledge-base/` folder and database seeder.

To avoid duplicating intelligence logic or creating competing risk algorithms, the new `brain/` module will serve as the **single source of truth** for all veterinary knowledge, individual health fingerprint calculations, evidence fusion, explainable risk scoring, exposure graph tracing, spatial-temporal cluster detection, event snapshotting, and scientific data validation. Existing frontend (`src/engine/`) and backend (`server/src/services/`) modules will be preserved as thin adapters/wrappers that invoke the unified `brain/` entry points.

---

## 2. Existing Intelligence & Data Modules Audit

| Component | Existing Location | Description | Target `brain/` Integration Strategy |
|---|---|---|---|
| **Health Fingerprint** | `src/engine/baselineEngine.js` & `server/src/services/healthFingerprintService.js` | 7-day individual rolling baseline & percent deviation | Unified in `brain/fingerprint/` (`baseline-engine.ts`, `deviation-detector.ts`, `feature-builder.ts`, `confidence.ts`). Frontend/backend will use thin wrappers. |
| **Evidence Fusion & Risk Evaluation** | `src/engine/ruleEngine.js` & `server/src/services/intelligenceCoreService.js` | Anomaly scoring, KB matching, monsoon multiplier, zoonotic/notifiable escalation, actionable recommendations | Unified in `brain/reasoning/` (`evidence-fusion.ts`, `explanation.ts`, `recommendation.ts`) and `brain/risk-engine/` (`anomaly-score.ts`, `disease-ranking.ts`, `risk-orchestrator.ts`). |
| **Exposure Engine** | `src/engine/exposureEngine.js` & `server/src/services/exposureEngineService.js` | Transmission-weighted proximity contact network scoring | Unified in `brain/exposure/` (`proximity-engine.ts`, `contact-graph.ts`, `movement-graph.ts`). |
| **Cluster Engine** | `src/engine/clusterEngine.js` & `server/src/services/clusterEngineService.js` | 72-hour district spatial-temporal anomaly cluster detection | Unified in `brain/exposure/` (`cluster-engine.ts`) and `brain/risk-engine/` (`cluster-risk.ts`). |
| **Event Snapshot** | `src/components/dashboard/AnimalsList.jsx` / `App.jsx` snapshot builders | Event evidence state capture | Unified in `brain/snapshot/` (`trigger-engine.ts`, `snapshot-builder.ts`, `evidence-window.ts`, `metadata.ts`). |
| **Global Knowledge Base** | `knowledge-base/` (22 subdirectories) & `src/data/diseases.js` | Verified 16 species, 20 breeds, 16 diseases, 33 disease-species associations | Migrated into `brain/knowledge/` while keeping root `knowledge-base/` as source data export/backup with backwards compatibility wrappers. |
| **Data Quality Validation** | `scripts/validation/validate_kb.cjs` | KB data quality audit script | Unified in `brain/validation/` (`evidence-validator.ts`, `rule-validator.ts`, `data-quality.ts`, `consistency.ts`). |
| **Simulation Engine** | `src/engine/simulationEngine.js` & `iot/sensor-simulator/simulator.js` | Time-accelerated simulation playback & synthetic sensor stream | Unified in `brain/simulation/` (`animal-scenarios/`, `outbreak-scenarios/`, `sensor-generator/`). |

---

## 3. Preservation & Wrapper Strategy

### Files to Move / Re-export into `brain/`
- All 22 subdirectories from `knowledge-base/` -> `brain/knowledge/`
- Rule definitions from `src/engine/ruleEngine.js` -> `brain/rules/`

### Files Remaining in Original Locations (with Adapters/Wrappers)
- `src/engine/baselineEngine.js` -> Imports `brain/fingerprint/baseline-engine`
- `src/engine/ruleEngine.js` -> Imports `brain/risk-engine/risk-orchestrator` & `brain/reasoning/evidence-fusion`
- `src/engine/exposureEngine.js` -> Imports `brain/exposure/proximity-engine`
- `src/engine/clusterEngine.js` -> Imports `brain/exposure/cluster-engine`
- `server/src/services/healthFingerprintService.js` -> Imports `brain/fingerprint`
- `server/src/services/intelligenceCoreService.js` -> Imports `brain/reasoning` & `brain/risk-engine`
- `server/src/services/exposureEngineService.js` -> Imports `brain/exposure`
- `server/src/services/clusterEngineService.js` -> Imports `brain/exposure`

### Zero Code Duplication Policy
- All core intelligence computations (score calculations, disease matching, baseline deviations, transmission weights, spatial clustering) will reside **exclusively in `brain/`**.
- Frontend components and backend API endpoints will call `brain/` public interfaces (`brain/index.ts` and `brain/contracts/`).

---

## 4. Dependencies & Import Mapping

- `brain/` will be written in clean, modular TypeScript with strict type definitions in `brain/contracts/`.
- Backend routes (`server/src/routes/api.routes.js`) will invoke `brain` entry points for `/api/intelligence/evaluate`, `/api/health-fingerprint`, `/api/exposure`, and `/api/clusters`.
- Frontend store (`src/db/store.js`) and UI views will consume `brain` output structures without directly mutating private brain states.
