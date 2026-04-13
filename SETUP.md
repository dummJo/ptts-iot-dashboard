# PTTS IoT Dashboard — Full Stack Setup Guide

This guide walks you through setting up the complete PTTS IoT Dashboard system with NestJS backend and Next.js frontend, backed by PostgreSQL.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Frontend                       │
│              (localhost:3000)                           │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  Dashboard  │  │  Reports    │  │   Settings   │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
                          ↓ HTTP (port 3000)
┌──────────────────────────────────────────────────────────┐
│               Next.js API Routes (SSR)                   │
│  - /api/dashboard (proxies to backend)                  │
│  - /api/reports (proxies to backend)                    │
│  - /api/config (proxies to backend)                     │
└──────────────────────────────────────────────────────────┘
                          ↓ HTTP (port 3001)
┌──────────────────────────────────────────────────────────┐
│                 NestJS Backend                           │
│              (localhost:3001)                           │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Telemetry    │  │ Config       │  │  Reports   │  │
│  │ Service      │  │ Service      │  │  Service   │  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Alarms       │  │ Assets       │                   │
│  │ Service      │  │ Service      │                   │
│  └──────────────┘  └──────────────┘                   │
└──────────────────────────────────────────────────────────┘
                          ↓ TCP (port 5432)
┌──────────────────────────────────────────────────────────┐
│               PostgreSQL Database                        │
│                 (localhost:5432)                        │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ assets       │  │ telemetry    │  │   alarms   │  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                         │
│  ┌──────────────┐                                      │
│  │ system_config│                                      │
│  └──────────────┘                                      │
└──────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** 18+ (use `nvm` or direct install)
- **PostgreSQL** 14+ ([install](https://www.postgresql.org/download/) or use Docker)
- **Git** (for version control)

## Quick Start

### 1. Set Up PostgreSQL

```bash
# Option A: Using macOS homebrew
brew install postgresql
brew services start postgresql

# Option B: Using Docker
docker run --name ptts-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ptts_iot \
  -p 5432:5432 \
  -d postgres:16

# Create the database (if using direct install)
createdb ptts_iot
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd /Users/rc8/!Claude/ptts-iot-backend

# Install dependencies
npm install

# Create environment file (already exists with defaults)
# Review .env.local and adjust as needed
cat .env.local

# Start the development server
npm run start:dev

# Expected output:
# ✓ Server listening on http://localhost:3001
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd /Users/rc8/!Claude/ptts-iot-dashboard

# Install dependencies
npm install

# Environment is already configured in .env.local
# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
```

## Environment Configuration

### Backend (.env.local)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ptts_iot
DB_LOGGING=false

# Service
API_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)

```env
# All services route through a single backend URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Individual service URLs (optional, fall back to BASE_URL)
NEXT_PUBLIC_TELEMETRY_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_REPORTS_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_CONFIG_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_ALARMS_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_ASSETS_SERVICE_URL=http://localhost:3001

# Features
NEXT_PUBLIC_FEATURE_REPORTS=true
NEXT_PUBLIC_FEATURE_ALARMS_ACK=true
```

## Available API Endpoints

### Telemetry Service

```bash
# Get current dashboard data with all metrics
GET http://localhost:3001/api/dashboard

# Response includes:
# - KPI metrics (temperature, vibration, uptime, alarms)
# - Trend data (last 24 points)
# - Status segments (alarm distribution)
# - Link/health summaries
# - Top 8 assets
# - Recent 10 alarms
# - System connection state
```

### Config Service

```bash
# Get current configuration
GET http://localhost:3001/api/config

# Save configuration (API keys, settings)
POST http://localhost:3001/api/config
Body: { "apiKeys": ["key1", "key2", ...] }
```

### Reports Service

```bash
# Generate period-based report
GET http://localhost:3001/api/reports?period=monthly

# Valid periods: daily, weekly, monthly, 3months, 6months, 12months
# Returns aggregated metrics by asset for the time range
```

### Alarms Service

```bash
# Acknowledge an alarm
PATCH http://localhost:3001/api/alarms/{alarmId}/ack

# Marks alarm as acknowledged with timestamp
```

### Assets Service

```bash
# Get asset details
GET http://localhost:3001/api/assets/{assetId}

# Update asset (temp, vib, link, health)
PUT http://localhost:3001/api/assets/{assetId}
Body: { "temp": 54.2, "vib": 3.1, "link": "online", "health": "good" }
```

## Database Schema

The backend auto-creates these tables:

```sql
-- Asset registry
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  temp FLOAT8,
  vib FLOAT8,
  link ENUM('online', 'offline'),
  health ENUM('good', 'warning', 'fault'),
  lastUpdate TIMESTAMP
);

-- Time-series telemetry data
CREATE TABLE telemetry (
  id UUID PRIMARY KEY,
  assetId UUID REFERENCES assets(id),
  temp FLOAT8,
  vib FLOAT8,
  timestamp TIMESTAMP
);
CREATE INDEX idx_telemetry_asset_ts ON telemetry(assetId, timestamp DESC);

-- Alarm events
CREATE TABLE alarm (
  id UUID PRIMARY KEY,
  assetId UUID REFERENCES assets(id),
  type VARCHAR,
  severity ENUM('critical', 'warning', 'info'),
  message TEXT,
  timestamp TIMESTAMP,
  acknowledgedAt TIMESTAMP,
  acknowledgedBy VARCHAR
);

-- System configuration
CREATE TABLE system_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  apiKeys TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Flow

### Dashboard Load

1. **Frontend** requests `/api/dashboard`
2. **Next.js** proxies to `http://localhost:3001/api/dashboard`
3. **NestJS** fetches from PostgreSQL:
   - All assets
   - Last 100 telemetry points
   - Unacknowledged alarms (50 most recent)
4. **Service layer** aggregates into DashboardDataDto:
   - Calculates KPI metrics
   - Generates trend data
   - Summarizes status by severity
   - Counts online/offline assets
   - Returns system state
5. **Frontend** receives fully-populated DashboardDataDto

### Report Generation

1. **Frontend** requests `/api/reports?period=monthly`
2. **Next.js** proxies to backend
3. **NestJS** calculates date range for period
4. **Service** queries PostgreSQL with date filter:
   - Aggregates avg/max temp & vib per asset
   - Counts alarms per asset
   - Calculates average uptime
5. Returns ReportSummaryDto with trend data

## Troubleshooting

### Backend won't start

```bash
# Check if PostgreSQL is running
psql -U postgres -d ptts_iot -c "SELECT 1"

# Verify port 3001 is available
lsof -i :3001

# Check database connection string in .env.local
cat .env.local
```

### Frontend won't fetch data

```bash
# Verify backend is running
curl http://localhost:3001/api/dashboard

# Check browser console for CORS errors
# Ensure CORS_ORIGIN in backend .env matches frontend URL

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Database connection failed

```bash
# Reset PostgreSQL (warning: deletes data)
psql -U postgres -c "DROP DATABASE ptts_iot;"
psql -U postgres -c "CREATE DATABASE ptts_iot;"

# NestJS will auto-create tables on next start
npm run start:dev
```

## Production Deployment

Before deploying:

1. **Update environment variables** for production URLs
2. **Enable database encryption** (credentials, API keys)
3. **Set NODE_ENV=production** (disables logging, optimizes)
4. **Use HTTPS** for all API calls
5. **Set CORS_ORIGIN** to frontend domain
6. **Run database migrations** (currently auto-sync via TypeORM)
7. **Monitor logs** for errors and performance

## Development Tips

### Mock vs Real Data

- **Mock data** is in `src/lib/mock-data.ts` (frontend only — not used anymore)
- **Real data** comes from PostgreSQL via NestJS backend
- To test with fresh data, truncate tables and restart backend

### Testing API Endpoints

```bash
# Dashboard
curl -s http://localhost:3001/api/dashboard | jq '.kpiData[0]'

# Reports
curl -s "http://localhost:3001/api/reports?period=daily" | jq '.period'

# Config
curl -s http://localhost:3001/api/config

# Health check (manual for now)
curl -s http://localhost:3001/ || echo "Backend down"
```

### Adding New Data

Since tables are currently empty, you'll need to seed initial data:

```bash
# Connect to database
psql -U postgres -d ptts_iot

-- Insert a test asset
INSERT INTO assets (id, name, type, temp, vib, link, health, lastUpdate)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Motor #1', 'ABB SmartSensor', 54.2, 3.1, 'online', 'good', NOW());

-- Insert telemetry
INSERT INTO telemetry (id, assetId, temp, vib, timestamp)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 54.5, 3.0, NOW());

-- Insert alarm
INSERT INTO alarm (id, assetId, type, severity, message, timestamp)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'temperature', 'warning', 'High temp warning', NOW());
```

## Next Steps

1. ✅ Backend running with NestJS + PostgreSQL
2. ✅ Frontend proxying to backend API
3. **TODO**: Implement real-time updates (WebSocket)
4. **TODO**: Add authentication & JWT validation
5. **TODO**: Create seed data script
6. **TODO**: Add data export (CSV/PDF reports)

## Support & Issues

- **Backend logs**: Check npm console output
- **Frontend logs**: Open browser DevTools → Network tab
- **Database logs**: `psql -U postgres -d ptts_iot`

For issues, check:
1. `.env.local` files match expected database/service URLs
2. PostgreSQL is running (`psql -U postgres -l`)
3. Ports 3000, 3001, 5432 are not in use
4. Node.js version is 18+
