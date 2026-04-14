# API Service Contract Specification (v1.1.0)

This document formally defines the REST API surface for the PTTS IoT Dashboard. The NestJS backend **must** implement these endpoints and return data in the specified JSON structures to ensure frontend compatibility.

## 1. Authentication (JWT Strategy)

All protected endpoints expect a `ptts-session` cookie containing a valid HS256 JWT.

### POST /api/login
- **Request Body**: `{ "username": "...", "password": "..." }`
- **Success Response**: `200 OK` + `Set-Cookie: ptts-session=...`
- **Error Response**: `401 Unauthorized`

---

## 2. Telemetry & Dashboard

### GET /api/dashboard
The primary combined endpoint for the overview page.

**Response Body (DashboardData):**
```json
{
  "kpiData": [
    {
      "label": "string",
      "value": "string",
      "unit": "string",
      "sub": "string",
      "trend": "string",
      "trendUp": "boolean",
      "color": "string",
      "ledClass": "string"
    }
  ],
  "trendData": [
    { "time": "HH:MM", "temp": 0.0, "vib": 0.0, "rms": 0.0, "powerKW": 0.0 }
  ],
  "linkSummary": { "online": 0, "offline": 0 },
  "healthSummary": { "good": 0, "warning": 0, "fault": 0 },
  "topAssets": [
    {
      "id": "uuid",
      "name": "string",
      "type": "string",
      "temp": 0.0,
      "vib": 0.0,
      "link": "online|offline",
      "health": "good|warning|fault",
      "powerKW": 0.0,
      "foundation": "rigid|flexible"
    }
  ],
  "recentAlerts": [
    {
      "id": "uuid",
      "asset": "string",
      "type": "string",
      "severity": "critical|warning|info",
      "message": "string",
      "time": "HH:MM"
    }
  ],
  "system": { "connected": "boolean", "lastSync": "ISO8601" }
}
```

---

## 3. Configuration & Assets

### GET /api/config
- **Response**: `{ "apiKeys": ["string"] }`

### PATCH /api/alarms/:id/ack
- **Response**: `{ "success": true }`

### GET /api/assets/:id
- **Response**: `Asset` object (see `topAssets` above)

### PUT /api/assets/:id
- **Request Body**: `Partial<Asset>`
- **Response**: `{ "success": true }`

---

## 4. Users (Admin Only)

### GET /api/users
- **Authorization**: Requires `admin` role in JWT.
- **Response**: `[ { "username": "string", "hash": "string", "role": "string" } ]`

### POST /api/users
- **Authorization**: Requires `admin` role in JWT.
- **Request Body**: `{ "username": "...", "password": "...", "role": "..." }`
- **Response**: `{ "success": true }`
