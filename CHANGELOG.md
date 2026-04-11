# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/dummJo/ptts-iot-dashboard/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dummJo/ptts-iot-dashboard/releases/tag/v0.1.0
