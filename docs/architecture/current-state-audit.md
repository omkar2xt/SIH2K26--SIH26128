# PASHU-RAKSHA — Current State Audit Document
**Date:** September 17, 2026  
**Version:** 1.0.0  
**Project:** PASHU-RAKSHA (SIH26128 - Livestock Health Early-Warning, Risk & Exposure Intelligence Platform)

---

## 1. Executive Summary

This audit assesses the existing PASHU-RAKSHA repository prior to executing the multi-phase production migration plan. The existing codebase is a feature-rich, working prototype containing verified domain knowledge for 16 species, 20 priority breeds, and 16 diseases specific to Maharashtra, India. It includes interactive role-based dashboards, a Leaflet GIS map with official GeoJSON data, an in-browser intelligence & baseline engine, an exposure network calculator, an alert engine, and an interactive simulation runner.

The objective of this migration is to transition the project from a browser-centric prototype into a production-ready, enterprise-grade, multi-tenant platform with a PostGIS/PostgreSQL-compatible Prisma schema, modular REST API services, scalable Knowledge Base schemas, offline synchronization, IoT protocols, and containerized deployment capabilities—while preserving 100% of existing functionality, UI components, and verified domain datasets.

---

## 2. Existing Architecture Overview

```
PASHU-RAKSHA (Current State)
├── Client Layer (Frontend)
│   ├── Framework: Vite 8.2 + React 19 + Tailwind CSS
│   ├── State & Storage: In-memory store + localStorage (`src/db/store.js`)
│   ├── Engine Layer (`src/engine/`):
│   │   ├── baselineEngine.js (7-day individual rolling baseline calculation)
│   │   ├── ruleEngine.js (Anomaly scoring, KB matching, monsoon multiplier)
│   │   ├── riskEngine.js (Farm & district risk aggregation)
│   │   ├── exposureEngine.js (Transmission-weighted proximity contact network)
│   │   ├── clusterEngine.js (72-hour district anomaly clustering)
│   │   ├── alertEngine.js (Notification & recipient escalation)
│   │   └── simulationEngine.js (Accelerated time-step simulation engine)
│   ├── GIS Layer: React Leaflet + Maharashtra GeoJSON (`src/assets/geo/`)
│   └── UI Components: Role-based views (Farmer, Vet, Official, Admin, Field Worker)
│
└── Backend Layer (Server)
    ├── Server: Express 5.2 + Socket.IO 4.8 (`server/index.js`)
    ├── Health Endpoint: `/api/health`
    └── Database ORM: Prisma 7.10 / 8.0-rc targeting SQLite (`server/prisma/schema.prisma`)
```

---

## 3. Existing Database & Data Storage

### Frontend Store (`src/db/store.js` & `src/db/seed.js`)
The current frontend operates on a synchronous, localStorage-backed data store managing the following collections:
- `species`: 16 species (Cattle, Buffalo, Goat, Sheep, Pig, Horse, Donkey, etc.)
- `breeds`: 20 priority Maharashtra breeds (Gir, Sahiwal, Pandharpuri, Osmanabadi, etc.)
- `diseases`: 16 priority diseases (FMD, LSD, HS, Brucellosis, PPR, Glanders, Anthrax, Rabies, BQ, Mastitis, Surra, Theileriosis, Enterotoxemia, Leptospirosis, Avian Influenza, Blue Tongue)
- `diseaseSpecies`: 33 verified disease-species association records
- `farms`: District farm registry records with geospatial coordinates
- `animals`: Individual animal records with baseline & current telemetry
- `observations`: Historical clinical & IoT observations
- `alerts`: Alert records with severity levels (GREEN, YELLOW, ORANGE, RED, CRITICAL)
- `cases`: Veterinary case workflows & status tracking
- `labSamples`: Sample chain of custody & lab test results
- `exposureEvents`: Proximity contact network records
- `containmentZones`: Geospatial restriction radiuses around outbreak clusters
- `auditLog`: Action & user audit entries
- `users`: Role-based user credentials
- `districts`: District-level summary statistics
- `syncQueue`: Offline sync queue for offline operation

### Server Database (`server/prisma/schema.prisma`)
The current backend Prisma schema defines minimal models:
- `User` (id, username, role, createdAt)
- `Animal` (id, species, breed, farmId, createdAt)
- `Farm` (id, name, district, animals, createdAt)

---

## 4. Existing Knowledge Base

The repository includes authoritative documentation and code for Maharashtra livestock health:
1. `MH_Livestock_Knowledge_Base_FINAL_v1.md`: Complete specification of 16 species, 20 breeds, 16 priority diseases, and 33 flattened records (`REC_01` to `REC_33`).
2. `src/data/diseases.js`: Standardized JavaScript catalog of symptoms, behavioral signs, physical signs, transmission routes, risk factors, camera/IoT signals, diagnostic methods, vaccination schedules, and containment protocols.
3. `MH_Livestock_KB_Phase1_Fix_Phase2_Audit.md`: Verification audit confirming knowledge base coverage.

---

## 5. Existing APIs & Services

### Frontend Mock Services (`src/services/`)
- `authService.js`: User authentication & session management.
- `animalService.js`: Animal registration & profile queries.
- `caseService.js`: Veterinary case management.
- `labService.js`: Laboratory orders & test updates.
- `reportService.js`: Incident reporting.
- `vaccinationService.js`: Vaccination logging.
- `alertService.js`: Alert status updates & acknowledgements.

### Express Server (`server/index.js`)
- `GET /api/health`: Returns server status and ISO timestamp.
- Socket.IO server listening on port `3000` for client connections.

---

## 6. Test Suite Status

- **Automated Unit Tests:** Currently missing in both root frontend and server directories.
- **Verification Strategy:** Manual testing via the interactive simulation runner (`src/components/demo/DemoRunner.jsx`) and browser inspection.

---

## 7. Missing Production Components

To achieve target architecture readiness, the following components must be built:
1. **Normalized Master Data & Operational Prisma Schema:** PostgreSQL + PostGIS target with SQLite compatibility for dev.
2. **Modularized Knowledge Base Directory Structure:** `knowledge-base/` containing JSON schemas and taxonomy files for 1000+ disease expansion readiness.
3. **Backend Intelligence Services:** Server-side execution of Health Fingerprint, Evidence Fusion, Anomaly Detection, Exposure Network, Cluster Detection, and Alert Routing.
4. **Structured REST API Layer:** `/api/auth`, `/api/tenants`, `/api/farms`, `/api/animals`, `/api/species`, `/api/diseases`, `/api/health-fingerprint`, `/api/intelligence`, `/api/alerts`, `/api/exposure`, `/api/clusters`, `/api/gis`, `/api/cases`, `/api/lab`, `/api/devices`, `/api/sync`, `/api/knowledge`.
5. **IoT & Sensor Architecture:** Firmware schemas, gateway specifications, MQTT/HTTP ingestion handlers, and synthetic telemetry simulator.
6. **Computer Vision Architecture:** Video stream ingestion blueprint, pose/behaviour detection pipeline, and evidence fusion interface.
7. **Multi-Tenancy & Security Middleware:** Tenant isolation, JWT authentication, RBAC authorization, and input validation schemas.
8. **Containerization & Deployment:** Dockerfiles for frontend/backend, `docker-compose.yml`, and environment configurations.

---

## 8. Preserved Files List

The following files contain core application logic, UI design, and verified domain datasets and MUST NOT be deleted or broken:
- `MH_Livestock_Knowledge_Base_FINAL_v1.md`
- `MH_Livestock_KB_Phase1_Fix_Phase2_Audit.md`
- `src/data/diseases.js`
- `src/data/demoDB.js`
- `src/db/seed.js`
- `src/engine/baselineEngine.js`
- `src/engine/ruleEngine.js`
- `src/engine/riskEngine.js`
- `src/engine/exposureEngine.js`
- `src/engine/clusterEngine.js`
- `src/engine/alertEngine.js`
- `src/engine/simulationEngine.js`
- `src/components/**` (All React dashboard views, GIS maps, UI components)
- `src/hooks/useSimulation.js`
- `src/assets/geo/maharashtra-districts.geojson`

---

## 9. Required Modifications Summary

1. `server/prisma/schema.prisma`: Replace simple 3-model schema with full PostgreSQL master-data & operational schema.
2. `server/index.js`: Reorganize into modular Express application (`server/src/routes`, `controllers`, `services`, `middleware`, `server.ts`).
3. `package.json` & `server/package.json`: Add TypeScript dependencies, Prisma client setup, test frameworks (Jest/Vitest), and execution scripts.
4. Directory Structure Alignment: Create folders for `intelligence/`, `iot/`, `vision/`, `knowledge-base/`, `docs/`, `docker/`, `tests/`, and `data/`.

---

## 10. Recommended Phase Migration Roadmap

- **Phase 0:** Audit existing codebase (Completed).
- **Phase 1:** Database Foundation & Prisma PostgreSQL/SQLite Schema Expansion.
- **Phase 2:** Global Knowledge Base Modularization & Validation Utilities.
- **Phase 3:** Operational REST API Services (`farms`, `animals`, `observations`).
- **Phase 4:** Backend Health Fingerprint Engine.
- **Phase 5:** Backend Intelligence Core & Evidence Fusion Engine.
- **Phase 6:** Event Snapshot & Alert Engine.
- **Phase 7:** Veterinary & Laboratory Workflow APIs.
- **Phase 8:** Exposure Engine, Cluster Detection & GIS API Integration.
- **Phase 9:** Offline-First Storage & Synchronization Service.
- **Phase 10:** IoT Sensor Integration Architecture & Telemetry Simulator.
- **Phase 11:** Computer Vision Integration Architecture & Signal Pipeline.
- **Phase 12:** Multi-Tenancy Isolation, Security Middleware & RBAC.
- **Phase 13:** Test Suite Implementation & Data Quality Validation.
- **Phase 14:** Production Dockerization & Technical Documentation.
