# PTTS Smartsensor IoT Dashboard

A frontend HMI (*Human Machine Interface*) application built with **Next.js** that serves as a web-based SCADA dashboard for industrial asset monitoring.

## 🚀 Features
- **Industrial UI/UX**: Designed using an aesthetic inspired by Top-Tier SCADA software (like *SmartICS* and *Ignition*). Uses dark modes, neon status indicators, monospace fonts, and sharp vector elements.
- **Unified Datalink Architecture**: Data routing is managed centrally through `lib/apiClient.ts` making future migrations to an Express, NestJS, MySQL, or Postgres stack completely painless.
- **ABB Ability Integrated**: Documented and prepared to ingest REST payloads directly from the [ABB Cloud Interface for Powertrain monitoring](https://api.conditionmonitoring.motion.abb.com).
- **Session Authentication**: Includes secure operator/engineer/admin session logic and user-management via JWT edge cookies.
- **Expanded Layouts**: Comes configured with modular route layouts including `Assets`, `Alarms`, `Trends`, and `Settings`.

## 🛠️ Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. The default redirect will push you to the `/login` portal.

## 🔌 Integrating a Custom Backend

By default, the frontend relies on an internal mock Next.js Route Handler (`/api/dashboard`) so that it can be previewed immediately.

If you are ready to point the dashboard to an actual Node.js API that serves real telemetry data:
1. Create a `.env` (or `.env.local`) file in the root directory.
2. Define the base URL of your API server:
   ```env
   NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"
   ```
3. The dashboard UI will automatically reroute its auto-polling system to fetch configuration and telemetry streams from this new target.

---
*Built for PTTS (PT Tekno Tirtayasa)*
