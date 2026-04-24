# ABB CIAM & POWERTRAIN API: THE MASTER INTEGRATION GUIDE

## 1. Authentication Architecture (Identity Layer)

The PTTS IoT Dashboard uses the **OAuth 2.0 Resource Owner Password Credentials (ROPC)** flow to perform a seamless backend-to-backend handshake with the ABB Identity Provider.

### 1.1 Core Endpoints (Production)
| Service | Endpoint URL |
| :--- | :--- |
| **Official OIDC Token** | `https://api.accessmanagement.motion.abb.com/polaris/oidc/token` |
| **Legacy Token Gateway** | `https://polaris.iam.motion.abb.com/oauth2/token` |
| **Developer Portal Token** | `https://accessmanagement.motion.abb.com/polaris/token` |

### 1.2 Verified Client IDs
Through deep inspection of the official ABB Powertrain Portal, we have verified the following Client IDs:

1.  **`k2spGAvfEich60kU63_lz7Ogrwsa` (Official Portal ID)**:
    *   **Usage**: Used by the live browser application (`powertrain.abb.com`).
    *   **Behavior**: Strictly enforced. May require `Origin: https://powertrain.abb.com` headers.
    *   **Grant Types**: Supports Authorization Code (Browser) and Password (API).

2.  **`iB3nB9Vvn5t55Vff_123xATBEf4a` (Backend Gateway ID)**:
    *   **Usage**: Recommended for backend services and automated drivers.
    *   **Behavior**: High rate-limit threshold.

3.  **`88691515-d913-43c3-b78b-333e6181b53e` (Developer Portal ID)**:
    *   **Usage**: Default ID for personal developer applications.

---

## 2. Troubleshooting & Error Codes

### 2.1 The "Account Locked" Incident (Error 17003)
**Symptom**: CIAM reports "Offline" even with correct credentials.
**Log Error**: `17003 Account is locked for user: ... in user store: DEFAULT in tenant: abbprod.`

*   **Cause**: Too many failed login attempts using a specific Client ID or from an unrecognized IP.
*   **Solution**:
    1.  Log out of the official `powertrain.abb.com` portal.
    2.  Wait 15-30 minutes for the automated lockout to clear.
    3.  Log back in via browser to "reset" the trust status.
    4.  Ensure the dashboard is using the **Balanced Identity Lifecycle** (v2.6+) to avoid spamming the token endpoint.

### 2.2 Invalid Grant vs. Invalid Client
*   **`invalid_client`**: The Client ID is wrong or not authorized for the requested endpoint.
*   **`invalid_grant`**: The Username/Password is wrong, OR the account is locked, OR MFA is required.

---

## 3. Data Ingestion Pipeline (Operational Layer)

### 3.1 The "Search" Philosophy
The Powertrain API does **not** support traditional `GET /assets`. You must use `POST` search endpoints with a filter payload.

**Standard Search Payload:**
```json
{
  "take": 100,
  "skip": 0,
  "organizationIds": ["<ORG_ID>"]
}
```

### 3.2 Field Mapping (Industrial Standard)
The system maps ABB telemetry to the local `ptts_telemetry` table using this precision logic:

| ABB Telemetry Type | PTTS Database Field | Transformation |
| :--- | :--- | :--- |
| `Temperature` | `temp` | Raw Float (Celsius) |
| `VibrationOverall` | `vib_overall` | RMS Velocity (mm/s) |
| `MotorCurrent` | `motor_current` | Raw Float (Amperes) |

---

## 4. Security & Hardening (Proxy Layer)

The **#GODMODE** security layer in `src/proxy.ts` ensures that while the backend talks to ABB, the user session remains cryptographically signed.

*   **CSP Policy**: Allows `img-src` from `powertrain.abb.com` to show real asset images.
*   **Token Redaction**: System logs are stripped of `access_token` strings to prevent credential leakage.

---

## 5. Maintenance Checklist
- [ ] **Check CIAM Status**: Pulsing red "CIAM OFFLINE" means a lockout or credential error.
- [ ] **Verify Org ID**: Use the dropdown to select the real Organization ID (e.g., `340494` for Cabot).
- [ ] **Handshake Debug**: Use `node scratch/debug-ciam-v4.js` to test connectivity manually.

**DOC_OWNER**: DummVinci Logic Engine
**VERSION**: 3.1.0-STABLE
