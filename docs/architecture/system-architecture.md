# PASHU-RAKSHA System Architecture Document

## Overview
PASHU-RAKSHA is an explainable, multi-tenant livestock health early-warning, risk assessment, exposure intelligence, and animal health surveillance platform.

## Architectural Layers

```
1. Presentation & Portals (React 19 + Vite 8.2 + Tailwind)
   ├── Farmer Portal
   ├── Field Worker / Paravet Portal
   ├── Veterinarian Portal
   ├── District & State Official Intelligence
   └── Administrator Portal

2. REST & Realtime API Layer (Express 5 + Socket.IO)
   ├── /api/auth & /api/tenants
   ├── /api/farms & /api/animals
   ├── /api/observations & /api/health-fingerprint
   ├── /api/intelligence & /api/risk
   ├── /api/exposure & /api/clusters
   ├── /api/cases & /api/lab
   └── /api/devices & /api/sync

3. Intelligence & Surveillance Core
   ├── Health Fingerprint (7-day individual baseline computation)
   ├── Evidence Fusion (Explainable risk stratification & KB rule matching)
   ├── Exposure Engine (Transmission-weighted contact network)
   └── Cluster Engine (72-hour spatial/temporal district anomaly detection)

4. Global Knowledge Base & Multi-Tenant Data Layer
   ├── Prisma ORM targeting SQLite (dev) / PostgreSQL + PostGIS (production)
   └── 22 Modular JSON Knowledge Base folders (`knowledge-base/`)
```

## Data Source Standards
Every health observation includes an explicit `dataSource` flag:
- `REAL_SENSOR` — Direct hardware reading from ESP32/LoRa collar.
- `REAL_CAMERA` — Processing signal from IP/RTSP camera feed.
- `FIELD_WORKER` — Physical observation logged by field worker/paravet.
- `VETERINARIAN` — Clinical exam by licensed veterinarian.
- `LAB` — Accredited laboratory test result.
- `SIMULATOR` — Synthetic telemetry generated for simulation playback.
- `IMPORTED` — Batch data import.
