<div align="center">

```
██████╗ ████████╗████████╗███████╗
██╔══██╗╚══██╔══╝╚══██╔══╝██╔════╝
██████╔╝   ██║      ██║   ███████╗
██╔═══╝    ██║      ██║   ╚════██║
██║        ██║      ██║   ███████║
╚═╝        ╚═╝      ╚═╝   ╚══════╝
  SmartSensor · Industrial IoT Platform
```

**PT PRIMA TEKINDO TIRTA SEJAHTERA**

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()

> **Sistem Monitoring Industrial berbasis Web** — menghubungkan data sensor ABB / RONDS secara real-time ke dashboard SCADA/HMI berbasis browser, dengan backend NestJS dan database PostgreSQL.

</div>

---

## ⚡ Arsitektur Sistem

```
[ ABB / RONDS Smart Sensor ]
           │  (MQTT)
           ▼
  ┌─────────────────────┐
  │   MQTT Broker Cloud  │
  └────────┬────────────┘
           │
           ▼
  ┌─────────────────────┐
  │  NestJS Backend API  │  ← port 3001
  │  5 Microservices     │     TypeORM + PostgreSQL
  │  - Telemetry         │
  │  - Config            │
  │  - Reports           │
  │  - Alarms            │
  │  - Assets            │
  └────────┬────────────┘
           │  (REST / HTTP)
           ▼
  ┌─────────────────────┐
  │  Next.js Dashboard   │  ← port 3000
  │  SCADA / HMI Layer   │     Recharts + TypeScript
  └─────────────────────┘
           │
           ▼
        [ User ]
```

> **Cross-Domain Mapping:**
> `Sensor` → `MQTT` → `NestJS (PLC)` → `PostgreSQL (Historian)` → `Next.js (HMI/SCADA)`

**Backend Repository:** [dummJo/ptts-iot-backend](https://github.com/dummJo/ptts-iot-backend)

---

## 🖥️ Halaman & Fitur

| Halaman | Route | Deskripsi |
|---|---|---|
| **Overview** | `/dashboard` | KPI cards, trend 24H, status donut, asset tag list |
| **Assets** | `/dashboard/assets` | Inventori aset lengkap + SCADA map placeholder |
| **Alarms** | `/dashboard/alerts` | Log alarm aktif + riwayat, ACK & export |
| **Reports** | `/dashboard/reports` | Generator laporan periodik (harian s/d tahunan) dengan export PDF & CSV |
| **Config** | `/dashboard/settings` | Konfigurasi API Key, Swagger docs ABB, manajemen pengguna |
| **Login** | `/login` | Splash screen industrial + autentikasi JWT |

---

## 🚀 Quick Start

Lihat [SETUP.md](./SETUP.md) untuk panduan lengkap setup backend + database.

```bash
# 1. Jalankan backend terlebih dahulu (port 3001)
cd ../ptts-iot-backend && npm run start:dev

# 2. Install dependencies frontend
npm install

# 3. Jalankan development server (port 3000)
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Sistem akan otomatis redirect ke `/login`.

**Default Credentials:**
| Username | Password | Role |
|---|---|---|
| `admin` | `admin` | Administrator |
| `operator` | `operator` | Operator |
| `engineer` | `engineer` | Engineer |

---

## 🔌 Integrasi Backend

Dashboard ini terhubung ke **NestJS backend** yang berjalan di `localhost:3001`. Semua API route Next.js berfungsi sebagai proxy ke backend dengan retry logic otomatis.

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Endpoint Backend (NestJS):

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/dashboard` | Telemetry aggregation + KPI + system status |
| `GET` | `/api/config` | Baca API Key tersimpan |
| `POST` | `/api/config` | Simpan API Key |
| `GET` | `/api/reports?period={period}` | Data agregat per periode |
| `PATCH` | `/api/alarms/{id}/ack` | Acknowledge alarm |
| `GET` | `/api/assets/{id}` | Detail aset |
| `PUT` | `/api/assets/{id}` | Update data aset |

> Period yang valid: `daily`, `weekly`, `monthly`, `3months`, `6months`, `12months`

---

## 📁 Struktur Proyek

```
/
├── src/                  ← Kode produksi
│   ├── app/              ← Next.js App Router
│   │   ├── api/          ← Proxy routes ke NestJS backend
│   │   │   ├── dashboard/route.ts
│   │   │   ├── config/route.ts
│   │   │   └── reports/route.ts
│   │   └── dashboard/    ← Halaman SCADA
│   ├── components/       ← Komponen UI modular
│   └── lib/
│       ├── apiClient.ts  ← Centralized data service layer
│       ├── types.ts      ← Semua TypeScript interfaces
│       └── session.ts    ← JWT session handler
├── SETUP.md              ← Panduan setup lengkap (DB, backend, frontend)
├── ARCHITECTURE.md       ← Spesifikasi arsitektur sistem
└── CHANGELOG.md          ← Riwayat perubahan
```

---

## 🛠️ Stack Teknologi

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Chart** | Recharts (drill-down zoom support) |
| **Auth** | JWT HS256, HTTPOnly Cookie |
| **Backend** | NestJS 10, TypeORM, class-validator |
| **Database** | PostgreSQL 14+ |
| **Broker (Planned)** | MQTT Cloud Broker |
| **Deploy** | Vercel (Frontend), Railway / Render (Backend) |

---

## 📊 Report Generator

Fitur laporan otomatis berstandar **PT Prima Tekindo Tirta Sejahtera**:

- **Periode**: 1 hari, 7 hari, 30 hari, 3 bulan, 6 bulan, 12 bulan
- **Isi Laporan**: AVG/MAX suhu & getaran per aset, uptime %, jumlah alarm
- **Sumber Data**: Agregasi real-time dari PostgreSQL via NestJS
- **Export**: PDF (via print) + CSV (UTF-8, Excel-compatible)

---

## 🗃️ Database Schema

```sql
assets       — Registri aset dengan status real-time
telemetry    — Time-series data suhu & getaran
alarm        — Log alarm dengan status acknowledged
system_config — Konfigurasi API keys & pengaturan sistem
```

Detail lengkap di [SETUP.md](./SETUP.md#database-schema).

---

## 🔐 Keamanan

- Session JWT dengan expiry 60 menit
- Cookie `httpOnly` — tidak dapat diakses JavaScript
- SHA-256 password hashing (upgrade ke bcrypt untuk produksi)
- SQL Injection protection via TypeORM parameterized queries
- CORS dikonfigurasi eksplisit — hanya origin yang diizinkan
- Semua data mengalir melalui API layer — **tidak ada akses DB langsung dari Frontend**

---

## 🔗 Referensi API Eksternal

- [ABB Ability Condition Monitoring API](https://api.conditionmonitoring.motion.abb.com/swagger/index.html?urls.primaryName=Cloud+Interface+for+ABB+Ability+Condition+Monitoring+for+powertrains+account)
- [ISO 10816-3 Vibration Standard](https://www.iso.org/standard/17588.html)

---

<div align="center">

**PTTS SmartSensor IoT Platform · v0.7.0**
*Full-stack integration: NestJS + PostgreSQL + Next.js*

`Sensor → MQTT → NestJS → PostgreSQL → Next.js → User`

</div>
