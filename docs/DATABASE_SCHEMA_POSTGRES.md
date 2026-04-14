# PostgreSQL Database Schema Specification (v1.1.0)

This document defines the formal database schema for the PTTS SmartSensor IoT Platform. It is designed for **PostgreSQL 14+** and is optimized for industrial telemetry (time-series) data.

## 1. Core Tables

### 1.1 `ptts_users`
Stores system operator accounts with role-based access control.

```sql
CREATE TABLE ptts_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL, -- Recommended: Bcrypt
  role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'engineer')),
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON ptts_users(username);
```

### 1.2 `ptts_assets`
The central registry of industrial equipment being monitored.

```sql
CREATE TABLE ptts_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id            VARCHAR(50) UNIQUE NOT NULL, -- e.g., "MTR-001"
  name              VARCHAR(100) NOT NULL,
  type              VARCHAR(50) NOT NULL,        -- e.g., "ABB SMARTSENSOR"
  location          VARCHAR(255),
  
  -- ISO 10816 Calculation Parameters
  power_kw          FLOAT8 DEFAULT 0,
  foundation_type   VARCHAR(10) DEFAULT 'rigid' CHECK (foundation_type IN ('rigid', 'flexible')),
  
  -- Manual Threshold Overrides
  vib_limit_warning FLOAT8, -- mm/s RMS
  vib_limit_fault   FLOAT8, -- mm/s RMS
  
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_tag ON ptts_assets(tag_id);
```

---

## 2. Telemetry & Events

### 2.1 `ptts_telemetry`
High-frequency time-series data containing sensor readings. 

> [!NOTE]
> If data volume exceeds 10M rows/month, consider partitioning this table by `timestamp` (Monthly partitions).

```sql
CREATE TABLE ptts_telemetry (
  id              BIGSERIAL PRIMARY KEY,
  asset_id        UUID NOT NULL REFERENCES ptts_assets(id) ON DELETE CASCADE,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Primary Metrics
  temp            FLOAT8, -- °C
  vib_overall     FLOAT8, -- mm/s RMS
  
  -- Secondary Metrics
  vib_rms         FLOAT8, -- mm/s
  vib_velocity    FLOAT8, -- mm/s peak
  vib_freq        FLOAT8, -- Hz
  motor_kw        FLOAT8, -- kW (Actual load)
  motor_current   FLOAT8, -- Amps
  
  -- System metadata
  raw_payload     JSONB   -- For debugging internal sensor data
);

-- Compound index for fast time-series retrieval per asset
CREATE INDEX idx_telemetry_asset_ts ON ptts_telemetry (asset_id, timestamp DESC);
```

### 2.2 `ptts_alarms`
Historical log of threshold breaches and system notifications.

```sql
CREATE TABLE ptts_alarms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES ptts_assets(id) ON DELETE CASCADE,
  severity        VARCHAR(10) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  alarm_type      VARCHAR(50) NOT NULL, -- e.g., "VIBRATION_FAULT", "TEMP_WARNING"
  message         TEXT NOT NULL,
  
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Acknowledgment Data
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES ptts_users(id),
  ack_comment     TEXT
);

CREATE INDEX idx_alarms_active ON ptts_alarms (acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX idx_alarms_asset ON ptts_alarms (asset_id);
```

---

## 3. Configuration & Metadata

### 3.1 `ptts_system_config`
Global settings and encrypted secrets (API Keys).

```sql
CREATE TABLE ptts_system_config (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  api_keys        JSONB DEFAULT '{}',     -- Encrypted storage for external service keys
  settings        JSONB DEFAULT '{}',     -- UI banners, theme defaults, etc.
  updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT single_row CHECK (id = 1)
);
```

---

## 4. Key Relationships & Logic mapping

| Feature | Tables Involved | Query Pattern |
| :--- | :--- | :--- |
| **Dashboard Overview** | `ptts_assets`, `ptts_telemetry`, `ptts_alarms` | `JOIN` assets with the most recent telemetry point and unacknowledged alarm count. |
| **Trend History** | `ptts_telemetry` | `SELECT` metrics `WHERE timestamp > NOW() - INTERVAL '24 hours'`. |
| **Asset Health** | `ptts_assets`, `ptts_telemetry` | Compare `vib_overall` vs ISO 10816 limits calculated from `power_kw` & `foundation_type`. |
| **User Sign-In** | `ptts_users` | Secure lookup by `username` and hash verification. |
