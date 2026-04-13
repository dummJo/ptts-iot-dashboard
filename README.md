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
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()

> **Sistem Monitoring Industrial berbasis Web** — menghubungkan data sensor ABB / RONDS secara real-time ke dashboard SCADA/HMI berbasis browser, tanpa ketergantungan pada perangkat lokal.

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
  │  Backend Worker API  │  ← NestJS / Express.js
  │  (Validation + Agg)  │     + PostgreSQL / Supabase
  └────────┬────────────┘
           │  (REST / HTTP)
           ▼
  ┌─────────────────────┐
  │  Frontend Dashboard  │  ← Next.js 16 (Vercel)
  │  SCADA / HMI Layer   │     + Recharts + TypeScript
  └─────────────────────┘
           │
           ▼
        [ User ]
```

> **Cross-Domain Mapping:**
> `Sensor` → `MQTT` → `NestJS (PLC)` → `PostgreSQL (Historian)` → `Next.js (HMI/SCADA)`

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

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
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

Dashboard ini dirancang untuk **zero-frontend-change migration** — cukup arahkan satu variabel environment:

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"
```

Seluruh fetching dashboard, config, dan report generator akan otomatis menggunakan backend baru.

### Endpoint yang diharapkan backend:

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/dashboard` | Telemetry data + system status |
| `POST` | `/api/dashboard` | Push data dari sensor/worker |
| `GET` | `/api/config` | Baca API Key tersimpan |
| `POST` | `/api/config` | Simpan API Key |
| `GET` | `/api/reports?period=monthly` | Data agregat per periode |

> Period yang valid: `daily`, `weekly`, `monthly`, `3months`, `6months`, `12months`

---

## 📁 Struktur Proyek

```
/
├── src/                  ← Kode produksi
│   ├── app/              ← Next.js App Router
│   │   ├── api/          ← Backend proxy routes (mock DB)
│   │   └── dashboard/    ← Halaman SCADA
│   ├── components/       ← Komponen UI modular
│   └── lib/
│       ├── apiClient.ts  ← Centralized data service layer
│       ├── types.ts      ← Semua TypeScript interfaces
│       ├── mock-data.ts  ← Dummy data (diganti DB nanti)
│       └── session.ts    ← JWT session handler
├── draft/                ← Kode AI mentah (belum direview)
├── analysis/             ← Catatan arsitektur & debugging
├── tests/                ← Test suite
├── ARCHITECTURE.md       ← Spesifikasi arsitektur sistem
└── CHANGELOG.md          ← Riwayat perubahan
```

---

## 🛠️ Stack Teknologi

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Chart** | Recharts (drill-down zoom support) |
| **Auth** | JWT HS256, HTTPOnly Cookie, bcrypt-ready |
| **Backend (Target)** | NestJS / Express.js |
| **Database (Target)** | PostgreSQL / Supabase / MySQL |
| **Broker (Target)** | MQTT Cloud Broker |
| **Deploy** | Vercel (Frontend), Railway / Render (Backend) |

---

## 📊 Report Generator

Fitur laporan otomatis berstandar **PT Prima Tekindo Tirta Sejahtera**:

- **Periode**: 1 hari, 7 hari, 30 hari, 3 bulan, 6 bulan, 12 bulan
- **Isi Laporan**: AVG/MAX suhu & getaran per aset, uptime %, jumlah alarm
- **Export**: PDF (via print) + CSV (UTF-8, Excel-compatible)

---

## 🔐 Keamanan

- Session JWT dengan expiry 60 menit
- Cookie `httpOnly` — tidak dapat diakses JavaScript
- SHA-256 password hashing (upgrade ke bcrypt untuk produksi)
- SQL Injection pattern blocking pada input sanitizer
- Semua data mengalir melalui API layer — **tidak ada akses DB dari Frontend**

---

## 🔗 Referensi API Eksternal

- [ABB Ability Condition Monitoring API](https://api.conditionmonitoring.motion.abb.com/swagger/index.html?urls.primaryName=Cloud+Interface+for+ABB+Ability+Condition+Monitoring+for+powertrains+account)
- [ISO 10816-3 Vibration Standard](https://www.iso.org/standard/17588.html)

---

<div align="center">

**PTTS SmartSensor IoT Platform · v0.6.0**
*Lean architecture for demonstration — expandable toward production*

`Sensor → MQTT → Backend → Database → Dashboard → User`

</div>
