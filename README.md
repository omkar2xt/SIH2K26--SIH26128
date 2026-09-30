# PASHU-RAKSHA
Livestock Health Early-Warning, Risk & Exposure Intelligence Platform

SIH 2026 - Problem Statement ID: 26128  
**Department**: Maharashtra State Innovation Society  
**Theme**: MedTech / BioTech / HealthTech  

## Overview
PASHU-RAKSHA is an explainable, rule-based decision-support platform designed for the Government of Maharashtra. It helps farmers, veterinarians, and district officials spot abnormal animal behavior early, understand disease risks with clear reasoning, and trace potential exposure across nearby herds. The system supports veterinary judgment—it does not replace it.

## Features
- **Role-Based Access Control (RBAC)**: Specialized, secure dashboards for Farmers, Veterinarians, Diagnostic Laboratories, Field Workers, Government Officials, and Administrators.
- **Health Fingerprinting**: Compares each animal against its individual behavioral baseline to detect subtle anomalies (Activity, Feeding, Movement, Rumination).
- **Intelligence Core & Alerting**: Surfaces clear, reasoned alerts based on the official Maharashtra Livestock Knowledge Base.
- **GIS Surveillance**: A robust, interactive geographic information system (Leaflet + GeoJSON) to track disease spread, containment zones, and clusters at the district level.
- **End-to-End Simulation**: A built-in, full-stack simulation engine that artificially accelerates time to demonstrate outbreak detection. The simulated workflow spans the entire backend pipeline, automatically creating Alerts, Veterinary Cases, Lab Orders, and Lab Results in real-time across role-specific dashboards.

## System Architecture

PASHU-RAKSHA operates on a robust, scalable architecture tailored for high performance and explainability in livestock health monitoring.

1. **Client Layer (User Interface)**
   - **Framework:** React.js powered by Vite for fast, modular rendering.
   - **Styling:** Tailwind CSS for a responsive, accessible, and dynamic UI.
   - **Data Visualization:** Recharts for analytical dashboards and React Leaflet for interactive GIS surveillance mapping.

2. **Application & Processing Layer (Backend Node.js)**
   - **API:** Express.js REST API with strict Zod payload validation and JWT authentication.
   - **Intelligence Core:** Evaluates incoming telemetry against baselines to generate reasoned alerts.
   - **Simulation Controller:** A dedicated endpoint (`/api/simulation/step`) that safely executes cross-role demo workflows (Observation -> Alert -> Case -> Lab Order -> Lab Result) directly on the backend to maintain data integrity.

3. **Data Layer**
   - **Database:** PostgreSQL managed via Prisma ORM for strong relational integrity and schema safety.
   - **Offline-First Sync:** The frontend employs local queues for telemetry fallback, seamlessly syncing with PostgreSQL when connectivity is restored.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Leaflet
- **Backend**: Node.js, Express.js, Prisma ORM, Socket.io
- **Database**: PostgreSQL
- **Security**: JWT, bcrypt, Helmet, Zod Validation

## Local Setup
1. Clone the repository: `git clone https://github.com/omkar2xt/SIH2K26--SIH26128`
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `cd server && npm install`
4. Configure `.env` in the `server` directory with your `DATABASE_URL` and `JWT_SECRET`.
5. Run Prisma migrations and seed the database: `cd server && npx prisma db push && node prisma/seed.js && node prisma/labSeed.js`
6. Start the backend server: `cd server && node index.js`
7. In a new terminal, start the frontend dev server: `npm run dev`

## Deployment

### Deploy to Vercel
This project is configured as a Vite SPA and can be deployed directly to Vercel.
1. Connect your GitHub repository to Vercel.
2. Vercel will automatically detect the Vite framework.
3. The included `vercel.json` ensures that all frontend routing is safely redirected to `index.html`.
4. Click **Deploy**.

### Deploy to Render
You can deploy this static site to Render using the included Blueprint:
1. Connect your repository to Render.
2. Render will automatically detect the `render.yaml` Blueprint file.
3. Apply the Blueprint. It will configure a Static Site serving the `./dist` folder with SPA fallback to `index.html`.
4. Alternatively, manually create a **Static Site** in Render:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`

## Environment Variables
The application uses environment variables for configuration. Rename `.env.example` to `.env` locally or add these keys to your hosting provider's dashboard:
```env
VITE_APP_NAME=PASHU-RAKSHA
VITE_ENVIRONMENT=production
```
