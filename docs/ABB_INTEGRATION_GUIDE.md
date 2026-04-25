# ABB Powertrain API Integration Guide (v2.0.0)

> **NOTICE:** This document has been updated to reflect the migration from the legacy ABB Ability™ SmartSensor cloud (`api.conditionmonitoring.motion.abb.com`) to the new **Powertrain Dashboard API Gateway**.

This guide provides technical specifications for building the backend "Driver" in NestJS to ingest data from the ABB Powertrain API into the PTTS PostgreSQL database.

## 1. Available Powertrain API Modules

The Powertrain API is composed of several REST modules. Our backend integration primarily interacts with the Asset, Timeseries, and Event APIs, but the following are available on the gateway:
- **Analytics API** (v1.0)
- **Asset API** (v1.0)
- **Diagnostics API** (v1.0)
- **Event API** (v1.0)
- **FFT API** (v1.0)
- **Gateway API** (v1.0)
- **Notification API** (v1.0)
- **Organization API** (v1.0)
- **Reporting API** (v2.0)
- **Sensor API** (v1.0)
- **Subscription API** (v1.0)
- **Timeseries API** (v1.0)

## 2. Authentication Strategy & Access

ABB has migrated to a centralized API Gateway with SSO integration.

- **Developer Portal**: [https://developer.powertrain.abb.com/](https://developer.powertrain.abb.com/)
- **Tutorials**: Available via the developer portal interface.
- **Authentication Method**: Single Sign-On (SSO) using standard OAuth2/Bearer tokens. 
  - If a user already has an ABB account, those credentials are used to access the Powertrain API. **No additional registration is required.**
- **Access Scope**: API access and data visibility are strictly bound to the organizations the user is already authorized to access within the main Powertrain portal.
- **Tooling Compatibility**: Endpoints can be tested natively via the Developer Portal UI, Postman, or PyCharm before implementing backend logic.

## 2. Ingestion Workflow (Cron Task)

> **CRITICAL ARCHITECTURE CHANGE**: The new Powertrain API is designed from scratch and is **NOT backwards compatible**. Querying objects is now ONLY supported through `POST /search` endpoints rather than simple `GET` requests.

The NestJS backend should run a scheduled task (e.g., every 5 minutes) to fetch the latest telemetry.

### Step 1: Discover Assets
`POST https://api.powertrain.abb.com/api/asset/Asset/Search`
- Replaces the old `GET /InstalledBase` endpoint.
- Returns a list of all assets available for the authenticated user.
- **Identifier Handling (CRITICAL)**:
  - `motionAssetId` **no longer exists**.
  - **Assets**: Identified by `serialNumber`, CIAM `assetId`, and the new Powertrain `id`.
  - **Organizations**: Identified by `guid`, numeric CIAM `organizationId`, and Powertrain `id`.
  - **Sites**: Identified by `ServIS identifier`, numeric CIAM `siteId`, and Powertrain `id`.
  - **AssetGroups**: Identified by numeric CIAM identifier or Powertrain `id`.
  - **Powertrains**: Identified purely by the Powertrain `id`.
  - **Sensors**: Identified by the Sensor serial number (`sensorIdentifier`) and Powertrain `id`.
- For PTTS persistence, map the Powertrain `id` or `serialNumber` to the internal `asset_id`.

#### Mapping Legacy IDs (Migration Use Case)
Since it is not possible to maintain the organization, site, asset group and asset ids from the legacy Smartsensor API, users will need to map those to new ids managed by the Powertrain portal. There is no way to retrieve an organization, site, or asset group directly using the corresponding Smartsensor ids. **The only way is through an asset search**.

**Request:**
`POST https://api.powertrain.abb.com/api/asset/List/GetDetails`
```json
{
   "legacyAssetIds": ["1234", "5678"]
}
```

**Response:**
```json
{
    "assetsDetailsList": [{
        "id": 0,
        "organization": { "organizationId": 0, "name": "string" },
        "site": { "siteId": 0, "name": "string" },
        "assetGroups": [{ "id": "string", "name": "string" }],
        "assetType": "Drive",
        "serialNumber": "string",
        "name": "string",
        "connectionStatus": "Online",
        "gateway": { "gatewayType": "string", "gatewayId": 0, "gatewaySerialNumber": "string" },
        "sensor": { "sensorType": "string", "sensorId": 0, "sensorSerialNumber": "string" }
    }]
}
```
*(You can use the response to map the new asset ids accordingly in your environment.)*


### Step 2: Fetch Latest Readings (Aggregated Timeseries)
For each active asset:
`POST https://api.powertrain.abb.com/api/timeseries/timeseries/aggregated?from={from}&to={to}`
- Replaces the old `GET /Measurement` endpoint.
- Provide the necessary payload and query parameters (`from`, `to`) to retrieve the sensor data block.

### Step 3: Fetch Active Events (Alarms)
`POST https://api.powertrain.abb.com/api/eventservice/Event/Search`
- Replaces the old `GET /Event` endpoint to fetch current warnings, alarms, and alerts.

### Step 4: Persistence
Transform the ABB JSON into the PTTS schema:
- Parse the returned timeseries buckets.
- Map ABB fields (based on the new schema structure, which must be inspected dynamically) to `vib_overall`, `temp`, and `vib_rms`.
## 3. Data Transformation Logic

*(Note: Exact payload structure should be verified against the new Powertrain API Gateway specifications via Postman or PyCharm testing.)*

| ABB Field | PTTS Field | Transformation |
| :--- | :--- | :--- |
| `measuredAt` | `timestamp` | Convert to UTC ISO string |
| `temp` | `temp` | Use as is (Celsius) |
| `vibOverall` | `vib_overall` | Use as is (mm/s RMS) |
| `vibrationRms` | `vib_rms` | Use as is (mm/s) |
| `deviceStatus` | `link` | Map `connected` → `online`, others → `offline` |

## 4. Error Handling & Rate Limiting

- **Rate Limits**: The Powertrain API Gateway enforces specific rate limits. Ensure the NestJS `HttpService` implements **exponential backoff**.
- **Organization Scoping**: Ensure the backend gracefully handles 403 Forbidden errors if a requested asset falls outside the user's authorized organizations.
- **Stale Data**: If `measuredAt` is older than 24h, mark the asset as `offline` in the `ptts_assets` table.

## 5. Endpoint Comparison (Legacy vs. Powertrain)

This table maps the legacy SmartSensor API use cases to the new Powertrain API endpoints to assist in backend refactoring.

| Use Case | Legacy SmartSensor API | New Powertrain API |
| :--- | :--- | :--- |
| **List assets (with measurements)** | `GET /Asset` | `POST /api/asset/Asset/Search`<br>`GET /api/timeseries/timeseries/` |
| **List assets (simplified)** | `GET /Asset/List` | `POST /api/asset/Asset/Search` |
| **List plants/sites** | `GET /Plant` | `POST /api/organization/Site/Search` |
| **List asset types** | `GET /AssetType` | *N/A (See API specification)* |
| **List measurement types** | `GET /Measurement/AssetType` | `GET /api/timeseries/config/asset/{assetId}` |
| **List measurement units** | `GET /Measurement/Unit` | `GET /api/timeseries/config/asset/{assetId}` |
| **Get detailed asset data** | `GET /Asset/{id}`<br>`GET /Asset/Data/{id}` | `POST /api/asset/Asset/Search`<br>`GET /api/timeseries/timeseries/lastknown/{assetId}` |
| **Sensor/Alarm notifications** | *N/A* | **via Webhooks** |
| **List events/alarms** | `GET /EventLog` | `POST /api/eventservice/Event/Search` |
| **Comment on event** | `POST /EventLog/Comment` | `POST /api/eventservice/Event/Comment` |
| **Close event** | `PUT /EventLog/Close` | `POST /api/eventservice/Event/Comment` |
| **Change health thresholds** | `PUT /Measurement/HealthInterval/{id}` | `PUT /api/timeseries/Timeseries/AssetLimits` |
| **Get condition index** | `GET /ConditionIndex`<br>`GET /ConditionIndex/{id}` | `GET /api/analytics/analytics/condition/history/{assetId}[?startTime][&endTime]` |
| **Get historic measurements** | `GET /Measurement/Value` | `POST /api/timeseries/timeseries/aggregated?from={from}&to={to}`<br>`POST /api/timeseries/timeseries/exporttimeseries` |
| **Enable asset specific notifications** | `PUT /Notification/Asset/Channel/{id}` | `PUT /api/notification/Webhook/Settings?organizationId={organizationId}` |
| **Disable asset specific notifications** | `DELETE /Notification/Asset/Channel/{id}` | `DELETE /api/notification/Webhook/Settings/{id}` |
| **Enable non-asset specific notifications** | `PUT /Notification/User/Channel/{id}` | `PUT /api/notification/Webhook/Settings?organizationId={organizationId}` |
| **Disable non-asset specific notifications** | `DELETE /Notification/User/Channel/{id}` | `DELETE /api/notification/Webhook/Settings/{id}` |

## 6. Comprehensive API Routing Dictionary

Based on direct exploration of the Powertrain Developer Portal (`developer.powertrain.abb.com`), the following is the complete dictionary of core operational endpoints required for integration:

### 6.1 Asset API (v1.0)
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/asset/Search` | `POST` | Searches for assets based on filters like `organizationIds`, `siteIds`, `assetGroupIds`, `assetIds`, and `assetSerialNumbers`. |
| `/api/asset/List/GetDetails` | `POST` | Maps legacy `motionAssetId` values to the new Powertrain schema (used strictly for migration). |

### 6.2 Timeseries API (v1.0)
| Endpoint | Method | Group / Purpose |
| :--- | :--- | :--- |
| `/api/timeseries/Timeseries/AssetConfig` | `GET` | **AssetConfig:** Retrieves configuration and sampling metadata for a specific asset. |
| `/api/timeseries/Timeseries/AssetLimits` | `GET` | **AssetLimit:** Retrieves threshold values (KPIs) for the asset. |
| `/api/timeseries/Timeseries/AssetLimits/Status` | `GET` | **AssetLimit:** Retrieves the current status of asset limits. |
| `/api/timeseries/Timeseries/AssetLimits` | `PUT` | **AssetLimit:** Updates threshold values for asset health parameters. |
| `/api/timeseries/Timeseries/LastKnown/{assetId}` | `GET` | **TimeseriesData:** Gets the most recent measurement data (snapshot). |
| `/api/timeseries/Timeseries/Aggregated` | `POST` | **TimeseriesData:** Retrieves historical measurement data with aggregation (Min, Max, Avg) over a specified time range. |
| `/api/timeseries/Timeseries/FullResolution` | `POST` | **TimeseriesData:** Retrieves raw, high-resolution historical data without aggregation. |
| `/api/timeseries/timeseries/exporttimeseries` | `POST` | **Export:** Exports timeseries data payload to an external format/file. |

### 6.3 Organization API (v1.0)
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/organization/Site/Search` | `POST` | Retrieves a list of plants/sites available for the organization. |
| `/api/organization/Organization/Search` | `POST` | Searches for organization-level hierarchy and access scopes. |

### 6.4 Event API (v1.0)
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/eventservice/Event/Search` | `POST` | Retrieves a list of events/alarms for accessible assets. |
| `/api/eventservice/Event/Comment` | `POST` | Allows providing comments, closing events, or attaching countermeasures. |

## 7. PTTS Dashboard Integration Pipeline (Code & JSON Mapping)

This section defines exactly how the NestJS backend "Cron Worker" must process ABB Powertrain API data and integrate it into the local PTTS PostgreSQL database via Prisma.

### 7.1 Asset Discovery & Synchronization
**Objective:** Keep the local `ptts_assets` table synced with the ABB Powertrain asset registry.

**1. Powertrain Request (Discover Assets)**
```http
POST https://api.powertrain.abb.com/api/asset/Asset/Search
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "take": 100,
  "skip": 0
}
```

**2. Expected Powertrain JSON Response (Example Schema)**
```json
{
  "totalCount": 1,
  "items": [
    {
      "id": "abb-powertrain-id-12345",
      "serialNumber": "SN-987654",
      "name": "Main Conveyor Motor",
      "assetType": "SmartSensor",
      "connectionStatus": "Online"
    }
  ]
}
```

**3. PTTS Prisma Database Mapping (`AssetService.sync()`)**
For each item in the array, the backend performs an `upsert` in Prisma:
```typescript
await prisma.asset.upsert({
  where: { tagId: abbAsset.serialNumber }, // Or use abbAsset.id
  update: {
    name: abbAsset.name,
    link: abbAsset.connectionStatus === 'Online' ? 'online' : 'offline',
  },
  create: {
    tagId: abbAsset.serialNumber,
    name: abbAsset.name,
    type: abbAsset.assetType,
    location: "ABB Powertrain Cloud", // Default
    link: abbAsset.connectionStatus === 'Online' ? 'online' : 'offline'
  }
});
```

### 7.2 Telemetry Polling (Timeseries Data)
**Objective:** Periodically fetch the latest sensor readings and store them in the `ptts_telemetry` table for the frontend dashboard charts.

**1. Powertrain Request (Fetch Latest Aggregated Data)**
Run every 5 minutes for each active asset.
```http
POST https://api.powertrain.abb.com/api/timeseries/Timeseries/Aggregated
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "assetId": "abb-powertrain-id-12345",
  "from": "2023-10-01T00:00:00Z",
  "to": "2023-10-01T00:05:00Z",
  "intervals": 1,
  "measurementTypes": ["Temperature", "VibrationOverall", "VibrationRms"]
}
```

**2. Expected Powertrain JSON Response (Example Schema)**
*(Note: Timeseries responses are often bucketed arrays. The backend must extract the latest valid value).*
```json
{
  "data": {
    "Temperature": [ { "timestamp": "2023-10-01T00:05:00Z", "avg": 45.5 } ],
    "VibrationOverall": [ { "timestamp": "2023-10-01T00:05:00Z", "avg": 2.1 } ],
    "VibrationRms": [ { "timestamp": "2023-10-01T00:05:00Z", "avg": 1.5 } ]
  }
}
```

**3. PTTS Prisma Database Mapping (`TelemetryService.ingest()`)**
The backend extracts the `avg` (or `max`) values and inserts them into our telemetry table:
```typescript
await prisma.telemetry.create({
  data: {
    assetId: localPttsAssetId, // Resolved from DB using tagId
    timestamp: new Date(payload.timestamp),
    temp: payload.data.Temperature[0]?.avg || null,
    vibOverall: payload.data.VibrationOverall[0]?.avg || null,
    vibVelocity: payload.data.VibrationRms[0]?.avg || null, // Mapped to vib_velocity/vib_rms
  }
});
```

### 7.3 Frontend Dashboard Integration
Once the backend successfully syncs this data into the PostgreSQL database:
1. **No Frontend Changes Required:** The Next.js API route (`/api/assets` and `/api/dashboard`) will automatically read the updated data from Prisma.
2. **Real-time Display:** The `ptts-iot-dashboard` UI will automatically display the new ABB Powertrain data on the charts and asset cards because the data contract between our internal database and the frontend remains unchanged.

## Reference Documentation (Salesforce Knowledge Base & Developer Portal)
- [SmartSolution API Powertrain API Portal](https://abb.lightning.force.com/lightning/articles/Knowledge/SmartSolution-API-Powertrain-API-Portal?language=en_US)
- [Instruction on Cloud Interface for ABB Ability Condition Monitoring for Powertrains](https://abb.lightning.force.com/lightning/articles/Knowledge/MotionAPI-Instruction-on-Cloud-Interface-for-ABB-Ability-Condition-Monitoring-for-powertrains-API-guide?language=en_US)
- [Migrate from Smart Sensor API Guide](https://developer.powertrain.abb.com/migrate-from-smart-sensor-api)
- [Powertrain Developer Support](https://developer.powertrain.abb.com/support)

