# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] — 2026-04-17

### Added
- **Industrial Security Reinforcement** — Introduced a dedicated security utility (`src/lib/security.ts`) providing standard-compliant Scrypt hashing and AES-256-GCM encryption.
- **Transparent Field Encryption** — All sensitive data, including ABB/RONDS API keys and Telegram/WhatsApp notification tokens, are now automatically encrypted at rest in PostgreSQL.
- **Scrypt Key Derivation (KDF)** — Encryption keys are now derived using Scrypt with industrial-grade cost parameters, ensuring high resistance to hardware-accelerated attacks.
- **SCRYPT-JWT Architecture** — Migrated the session layer from standard HS256 to a custom SCRYPT-derived key architecture, significantly increasing the complexity required for token forgery attacks.
- **Security Visibility Update** — Refreshed all UI security labels across Login, Dashboard, and Settings modules to reflect the new **SCRYPT · JWT** industrial standard.
- **Edge Runtime Optimization** — Resolved a critical authentication lock-out by migrating JWT verification to a cross-platform architecture compatible with Next.js Middleware (Edge Runtime).

### Changed
- **Encrypted Data Flow** — Refactored the `Configuration API` and `Notification Service` to handle just-in-time decryption, ensuring secrets never reside in plaintext within the persistent layer.
- **Synchronized Security Seeding** — Updated `prisma/seed.ts` to utilize the production-grade security library, aligning initial system states with global encryption standards.

## [1.2.0] — 2026-04-17

### Added
- **Foundational API Testing** — Introduced an integration test suite (`tests/dashboard.test.ts`) covering core dashboard and reporting endpoints.
- **Dedicated Alarm Engine** — Refactored industrial violation logic into a standalone utility (`src/lib/alarmEngine.ts`) for better modularity and future background worker support.
- **Real-time Sidebar Observations** — The sidebar alarm badge is no longer hardcoded; it now dynamically polls and reflects the live count of active alarms from the database.

### Changed
- **Security Hardening (Scrypt)** — Upgraded password hashing from SHA-256 to **Scrypt** with secure salting, providing industrial-grade protection for user credentials.
- **Zero-Trust Login** — Removed insecure plaintext password fallbacks and improved input sanitization in authentication server actions.
- **Trend Data Resilience** — Enhanced the dashboard trend logic with a fallback mechanism that automatically selects the first available asset if the primary tag (`MTR-001`) is missing, preventing UI breaks.
## [1.1.0] — 2026-04-15

### Added
- **PostgreSQL Production Migration** — Fully transitioned from local JSON storage to **Neon PostgreSQL**, enabling scalable and persistent industrial data management.
- **24-Hour Telemetry History** — Implemented an enriched data seeding layer providing 24 hours of back-dated historical telemetry for Motor, Pump, and Compressor assets.
- **Persistent Threshold Management** — Manual vibration limit overrides on the Overview page are now synchronized directly with PostgreSQL, persisting across user sessions and devices.
- **Industrial Alarm Engine** — Real-time server-side logic that automatically evaluates live telemetry against user-defined limits and persists unacknowledged alarm records.
- **Multi-Channel Notifications (WA & TG)** — Integrated a centralized notification engine with a new dedicated **NOTIFICATIONS** configuration tab, supporting real-time alerts via **Telegram Bot API** and **WhatsApp Gateways** (e.g., Fonnte).
- **Notification Verification UI** — Added "Send Test" functionality for both Telegram and WhatsApp to verify credential connectivity instantly from the dashboard.

### Fixed
- Resolved Prisma/Neon compatibility issues in serverless environments by optimizing connection pooling and adapter initialization.
- Fixed dashboard empty states by ensuring the API returns full `DashboardData` structures derived from literal database values.

## [0.9.0] — 2026-04-14

### Added
- **ISO 10816 Vibration Standardization** — Automatic calculation of `warning` and `fault` limits based on individual motor power (kW rating) and foundation type (rigid vs flexible).
- **Role-Based Threshold Configuration** — Introduced a new modal (`ThresholdModal.tsx`) allowing users with `Admin` or `Engineer` roles to securely override ISO baseline thresholds per asset. Operators are restricted to a read-only view of thresholds.
- **Dynamic LED Sync** — System-wide asset health states are strictly synchronized with the newly calculated vibration limits, ensuring the dashboard TopBar, Sidebar, and Status Donut correctly match the table LEDs at all times.

### Changed
- **Trend Chart Enhancements** — Transformed the chart timeframe selector into a highly compact dropdown menu, expanding options to allow filtering by `1 min`, `5 min`, `30 min`, `hourly`, `daily`, `weekly`, `monthly`, and `yearly` intervals.
- The default UI mock implementation now locally processes session-stored threshold overrides in the absence of a live database.

## [0.8.0] — 2026-04-13

### Added
- `src/lib/config.ts` — **Service Registry**: each microservice (telemetry, reports, config, alarms, assets) has its own env-configurable URL; falls back to global base URL
- `src/lib/config.ts` — **Feature Flags**: `FEATURES.reports`, `alarmsAck`, `assetTopoMap`, `mqttPush` — controlled via `.env.local`, no code change needed
- `.env.example` — Documents all environment variables with inline descriptions for onboarding
- **Retry logic** in `apiClient`: auto-retries on `503`/`502`/network failure up to `maxRetries` with configurable delay
- **Request timeout** via `AbortController` (default 10s) preventing hung fetch calls
- `ApiError` custom class for structured error handling in frontend catch blocks
- `apiClient.acknowledgeAlarm(id)` — Alarm ACK endpoint stub (wired to alarms microservice)
- `apiClient.getAsset(id)` / `apiClient.updateAsset(id, data)` — Asset CRUD stubs

### Changed
- `apiClient` fully rewritten to use `serviceUrl()` from config registry — ready for multi-service routing
- All fetch calls now share a single `apiFetch<T>()` wrapper (DRY, typed, retryable)



### Added
- **Report Generator** — `GET /api/reports?period=...` route with full aggregated mock data (daily, weekly, monthly, 3M, 6M, 12M)
- **Drill-down TrendChart** — Recharts `<Brush>` component enables drag-to-zoom; auto-switches granularity (5min → 15min → 1hr → daily) based on selection span
- **Granularity selector** on TrendChart (5 MIN / 15 MIN / 1 JAM / 1 HARI / 1 MGG) mirroring DB `GROUP BY` interval logic
- **PDF Export** — `window.print()` with branded PTTS print template (logo, company header, colored asset table, ISO notes)
- **CSV Export** — UTF-8 BOM compatible, Excel-safe download with full report payload
- `src/lib/types.ts` extended with `ReportPeriod`, `AssetReportRow`, `ReportSummary`
- `apiClient.getReport(period)` — fully typed report fetch method
- `draft/`, `analysis/`, `tests/` workspace directories tracked via `.gitkeep`

### Changed
- **Refactored project structure** — all source code moved to `src/` (Next.js standard)
- **CSS Design Tokens** — refreshed dark and light mode palettes for higher contrast and industrial clarity
- **README.md** — complete rewrite with industrial digitalization aesthetic, ASCII banner, architecture diagram, API table, stack matrix
- All `any` types eliminated; replaced with strict interfaces from `src/lib/types.ts`



### Added
- Configurable polling interval dropdown directly in the `TopBar` (5s, 1m, 5m, OFF)
- Mock CRUD Database via `/api/config` route to permanently save and read API Key configurations
- Architectural specification document (`ARCHITECTURE.md`) outlining Cloud backend integration
- System state tracking showing "LIVE DEMO" during active loops or "OFFLINE (RETAINED DATA)" when backend is disconnected/no keys found

### Changed
- Dashboard `TopBar` completely unified across all sub-pages (`assets`, `reports`, `alerts`)
- `Settings` page modernized into a true CRUD client sending JSON payloads to the database
- Realigned text contrast and glowing typography on `Login` page to meet high-vibility SCADA requirements
## [0.5.0] — 2026-04-13

### Added
- Next.js API route `/api/dashboard` as a temporary in-memory datalink store (GET/POST)
- Auto-polling system in dashboard `page.tsx` (refreshing data every 5 seconds)
- API connection status indicator during data load ("CONNECTING TO DATALINK...")

### Changed
- All dashboard components (`AlertsTable`, `AssetTable`, `StatusDonut`, `TrendChart`, `VibrationBar`) rewritten to be stateless and accept `props` instead of hardcoded `mock-data` imports
- Footer labels updated to reflect active API connection ("API CONNECTED · NODE.JS READY")

## [0.4.0] — 2026-04-11

### Added
- Multi-user authentication: `admin`, `operator`, `engineer` roles (SHA-256 + timing-safe compare)
- Role stored in JWT payload — each user gets role-scoped session token

### Fixed
- Login page text contrast outside card box: "PTTS" label → white, "OPERATOR SIGN IN" → `#7ab8cc`, footer → `#4a7a96`
- Version number in login footer corrected to v0.4.0

## [0.3.0] — 2026-04-11

### Added
- Ignition SCADA-style full redesign — dark industrial aesthetic with `scada-card`, `scada-label`, `scada-value` CSS primitives
- LED indicator system — `led-online`, `led-warning`, `led-fault`, `led-offline` with pulsing glow animation
- Scanline overlay effect on splash and login screens
- Top breadcrumb bar in dashboard (PTTS › SMARTSENSOR › OVERVIEW)
- System info panel in sidebar (uptime, tag count, DB status)
- Reference threshold lines in trend chart (temp 60°C, vib 3.5 mm/s)
- Striped row hover on asset table
- ACK button on alarm cards
- Footer bar in dashboard with session info
- `"use client"` on AssetTable for mouse event support

### Changed
- PTTS logo source updated to `ptts.co.id` (official circular logo)
- Session timeout reduced from 8h → **60 minutes** (JWT + cookie)
- Brand color labels removed from UI — colors used as visual reference only
- Sidebar navigation labels changed to SCADA terminology (OVERVIEW, ASSETS, ALARMS, TRENDS, CONFIG)
- All typography switched to monospace font stack (JetBrains Mono → ui-monospace)
- KPI cards now show `unit` separately from value, with `ledClass` per state
- Alarm severity badge → ACK button pattern
- `proxy.ts` renamed function from `middleware` → `proxy` (Next.js 16 convention fix)

### Fixed
- TypeScript error on `phase === "login"` comparison in `LoginClient.tsx`
- Missing `CartesianGrid` import in `VibrationBar.tsx`

## [0.2.0] — 2026-04-11

### Added
- Animated splash screen — PTTS logo with spinning double-ring, terminal boot sequence (4 init lines), progress bar
- Login page with secure session authentication
- JWT HS256 session via `jose` (edge-compatible, 8h expiry)
- Route protection via Next.js `proxy.ts` — all `/dashboard` routes guarded
- SHA-256 password hashing with `timingSafeEqual` constant-time comparison
- SQL/injection pattern blocker on all login inputs
- httpOnly secure session cookie
- Logout button in sidebar (server action)
- Light/dark mode toggle with `localStorage` persistence (default: dark)
- Brand color system — PTTS teal/blue primary, ABB red (#CC0000), FLUKE yellow (#FFD700), SKF blue (#003DA5)
- `ThemeToggle` component
- `LogoutButton` component (server action form)
- Auth server actions: `loginAction`, `logoutAction`

### Changed
- Dashboard color scheme updated to PTTS brand colors across all components
- Sidebar redesigned — PTTS primary blue/teal, brand tag row (ABB / FLUKE / SKF)
- KPI cards, charts, tables now use CSS variables for full dark/light mode support
- Trend chart lines: temperature → FLUKE yellow, vibration → SKF blue
- Vibration bar chart: fault → ABB red, warning → FLUKE yellow, OK → SKF blue
- `app/page.tsx` now redirects to `/login` instead of `/dashboard`
- `middleware.ts` renamed to `proxy.ts` (Next.js 16 convention)

## [0.1.0] — 2026-04-11

### Added
- Initial project scaffold with Next.js 16 + TypeScript + Tailwind CSS
- Dashboard layout — sidebar navigation, sticky header
- 4 KPI stat cards (Active Sensors, Alerts, Temperature, Vibration)
- Trend line chart — dual-axis temperature + vibration (24h mock data)
- Asset status donut chart (Online / Warning / Fault / Offline)
- Asset overview table with live readings and color thresholds
- Vibration ranking horizontal bar chart
- Recent alerts panel — severity badges (critical / warning)
- Mock data: ABB SmartSensor + RONDS SmartSensor asset set
- Recharts and lucide-react dependencies

[Unreleased]: https://github.com/dummJo/ptts-iot-dashboard/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.9.0...v1.1.0
[0.9.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.5.0...v0.8.0
[0.5.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dummJo/ptts-iot-dashboard/releases/tag/v0.1.0
