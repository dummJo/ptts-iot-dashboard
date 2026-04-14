# ABB SmartSensor Backend Integration Guide (v1.1.0)

This guide provides technical specifications for building the backend "Driver" in NestJS to ingest data from the ABB Ability™ SmartSensor cloud into the PTTS PostgreSQL database.

## 1. Authentication Strategy

ABB uses API Key authentication for its cloud interface.

- **Header Name**: `Ocp-Apim-Subscription-Key`
- **Source**: User provided via the `/dashboard/settings` page in the PTTS Dashboard.
- **Environment Variable**: `ABB_API_BASE_URL` (Defaults to `https://api.conditionmonitoring.motion.abb.com/motion/ability/v1`)

## 2. Ingestion Workflow (Cron Task)

The backend should run a scheduled task (e.g., every 5 minutes) to fetch the latest telemetry.

### Step 1: Discover Assets
`GET /devices`
- Returns a list of all sensors linked to the account.
- Map `deviceId` to PTTS `asset_id`.

### Step 2: Fetch Latest Readings
For each active `deviceId`:
`GET /devices/{deviceId}/latest-telemetry`
- Returns a JSON object with `temperature`, `vibrationOverall`, `rms`, etc.

### Step 3: Persistence
Transform the ABB JSON into the PTTS `ptts_telemetry` schema:
- `vibrationOverall` (ABB) → `vib_overall` (PTTS)
- `temperature` (ABB) → `temp` (PTTS)
- `vibrationRms` (ABB) → `vib_rms` (PTTS)

---

## 3. Data Transformation Logic

| ABB Field | PTTS Field | Transformation |
| :--- | :--- | :--- |
| `measuredAt` | `timestamp` | Convert to UTC ISO string |
| `temp` | `temp` | Use as is (Celsius) |
| `vibOverall` | `vib_overall` | Use as is (mm/s RMS) |
| `vibrationRms` | `vib_rms` | Use as is (mm/s) |
| `deviceStatus` | `link` | Map `connected` → `online`, others → `offline` |

## 4. Error Handling & Rate Limiting

- **Rate Limits**: ABB Ability API has strict rate limits. Implement **exponential backoff** in the NestJS `HttpService`.
- **Stale Data**: If `measuredAt` is older than 24h, mark the asset as `offline` in the `ptts_assets` table.
