# PASHU-RAKSHA
Livestock Health Early-Warning, Risk & Exposure Intelligence Platform

SIH 2026 - Problem Statement ID: 26128  
**Department**: Maharashtra State Innovation Society  
**Theme**: MedTech / BioTech / HealthTech  

## Overview
PASHU-RAKSHA is an explainable, rule-based decision-support platform designed for the Government of Maharashtra. It helps farmers, veterinarians, and district officials spot abnormal animal behavior early, understand disease risks with clear reasoning, and trace potential exposure across nearby herds. The system supports veterinary judgment—it does not replace it.

## Features
- **Role-Based Access**: Specialized dashboards for Farmers, Veterinarians, Field Workers, Government Officials, and Administrators.
- **Health Fingerprinting**: Compares each animal against its individual behavioral baseline to detect subtle anomalies (Activity, Feeding, Movement, Rumination).
- **Explainable AI (Rule Engine)**: Surfaces clear, reasoned alerts based on the official Maharashtra Livestock Knowledge Base.
- **GIS Surveillance**: A robust, interactive geographic information system (Leaflet + GeoJSON) to track disease spread and clusters at the district level.
- **Live Simulation**: A built-in simulation engine that artificially accelerates time to demonstrate outbreak detection, alert escalation, and containment protocols in a presentation setting.

## System Architecture

PASHU-RAKSHA operates on a robust, scalable architecture tailored for high performance and explainability in livestock health monitoring.

1. **Client Layer (User Interface)**
   - **Framework:** React.js powered by Vite for fast, modular rendering.
   - **Styling:** Tailwind CSS for a responsive, accessible, and dynamic UI.
   - **Data Visualization:** Recharts for analytical dashboards and React Leaflet for interactive GIS surveillance mapping.
   - **User Portals:** Distinct, role-based dashboards for Farmers, Veterinarians, Field Workers, Government Officials, and Admins.

2. **Application & Processing Layer**
   - **State Management:** React state/context to maintain live simulated events and user sessions.
   - **Rule Engine (Explainable AI):** Evaluates incoming behavioral data (Activity, Feeding, Movement) against the official Maharashtra Livestock Knowledge Base to generate reasoned alerts.
   - **Simulation Engine:** Built-in module to artificially accelerate time and generate mock telemetry for outbreak detection demonstrations.

3. **Data Layer**
   - **Health Fingerprinting Data:** Manages individual animal baselines for anomaly detection.
   - **Geospatial Data:** Integrates official Maharashtra GeoJSON formats with OpenStreetMap tiles for district-level tracking.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Mapping**: React Leaflet, OpenStreetMap, official Maharashtra GeoJSON
- **Charts/Analytics**: Recharts
- **Icons**: Lucide React

## Local Setup
1. Clone the repository: `git clone https://github.com/omkar2xt/SIH2K26--SIH26128`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

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
