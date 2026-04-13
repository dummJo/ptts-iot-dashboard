# Industrial Monitoring System Architecture (Final Spec)

## 1. Objective

Membangun sistem monitoring industrial berbasis sensor (ABB / RONDS) yang:
* Real-time (atau near real-time)
* Scalable (tahap demo → production)
* Tidak bergantung pada PC/laptop lokal
* Mendukung reporting (PDF & Excel)
* Memiliki data retention terkontrol

---

## 2. High-Level Architecture

```text
[ Sensor (MQTT Enabled) ]
            ↓
     MQTT Broker (Cloud)
            ↓
 Worker + API (Backend Service)
            ↓
   PostgreSQL / Managed DB
            ↓
     Frontend (Dashboard)
            ↓
        User
```

Optional (Control Loop):
```text
User → Frontend → API → MQTT → Device
```

---

## 3. Layer Breakdown

### 3.1 Sensor Layer
* Device: ABB / RONDS Smart Sensor
* Protocol: MQTT (native)
* Role: Data producer

### 3.2 Communication Layer
* MQTT Broker (Cloud)
* Responsibilities:
  * Message routing
  * Topic management
  * QoS handling

### 3.3 Processing Layer (Worker)
Responsibilities:
* Data validation
* Filtering (noise removal)
* Timestamp normalization
* Aggregation (avg, min, max)

### 3.4 API Layer
Responsibilities:
* Expose data to frontend
* Handle authentication
* Query database

### 3.5 Database Layer
* PostgreSQL / Managed DB
* Stores:
  * Processed data
  * Aggregated data

### 3.6 Presentation Layer
* Dashboard (Frontend)
* Data visualization

---

## 4. Data Flow (End-to-End)

```text
Sensor → MQTT → Worker → DB → API → Frontend
```

---

## 5. Data Strategy

### 5.1 Data Types

| Type            | Description             | Retention  |
| --------------- | ----------------------- | ---------- |
| Raw Data        | Direct sensor data      | 1–3 months |
| Aggregated Data | Processed (avg/min/max) | 12 months  |
| Summary         | Daily/Monthly summary   | Long-term  |

### 5.2 Retention Policy
* Auto delete or archive after 12 months
* Implement via scheduled job (cron)

### 5.3 Auto Archive Strategy
Option A: Move data to archive table
Option B: Export to file storage (S3-like)

---

## 6. Reporting System

### 6.1 Trigger
* User clicks button (on-demand)

### 6.2 Flow
```text
Frontend → API → DB → Generate File → Download
```

### 6.3 Report Types
**Basic Report:**
* Small data range
* Sync generation

**Advanced Report:**
* Large data range
* Async generation (recommended later)

### 6.4 Output Formats
* PDF
* Excel

---

## 7. Performance Controls

Required Controls:
* Limit data query (time range)
* Pagination
* Batching insert (worker)
* Rate limit API

---

## 8. Failure & Risk Points

### 8.1 Data Loss
* Cause: MQTT disconnect
* Mitigation: QoS 1/2, Reconnect logic

### 8.2 Duplicate Data
* Cause: MQTT resend
* Mitigation: Unique constraint (sensor_id + timestamp)

### 8.3 DB Bottleneck
* Cause: High-frequency insert
* Mitigation: Batch insert

### 8.4 Memory Leak
* Cause: Poor backend handling
* Mitigation: Stateless design, Avoid global state accumulation

---

## 9. Deployment Strategy (No VPS)

Components Hosted in Cloud:
* MQTT Broker → Cloud provider
* Backend (Worker + API)
* Database → Managed
* Frontend → Cloud hosting (Vercel)

---

## 10. Architecture Options (Max 3)

### Option 1 — Lean Cloud (Recommended)
* MQTT: Cloud Broker
* Backend: Single service (Worker + API)
* DB: Managed PostgreSQL
* Frontend: Hosted
* Pros: Simple, Fast deployment, Low maintenance.
* Cons: Limited scalability.

### Option 2 — Semi-Scalable
* MQTT: Cloud Broker
* Worker: Separate service
* API: Separate service
* DB: Managed
* Pros: Better separation, More scalable.
* Cons: More complexity, Slightly higher cost.

### Option 3 — Advanced (Future)
* MQTT: Dedicated broker
* Worker: Scalable service
* API: Independent
* DB: Optimized (partitioning / time-series)
* Pros: High scalability, Production ready.
* Cons: Complex, Overkill for demo.

---

## 11. Platform Comparison (Backend Hosting)

| Platform | Pros                              | Cons                   | Use Case           |
| -------- | --------------------------------- | ---------------------- | ------------------ |
| Railway  | Easy deploy, fast setup           | Limited control        | Demo / early stage |
| Render   | Stable, background worker support | Slightly slower deploy | Mid-stage          |
| VPS      | Full control                      | High maintenance       | Production         |

---

## 12. Key Rules (Non-Negotiable)

* Frontend must NOT connect directly to DB
* All data must pass through backend
* Limit data query size
* Implement retention from early stage
* Do not rely on local machine for runtime

---

## 13. Counterplan (If Things Go Wrong)

**Scenario 1: System becomes slow**
* Reduce data frequency, Add batching, Optimize query.

**Scenario 2: DB overload**
* Add aggregation layer, Reduce raw data storage.

**Scenario 3: Report generation too heavy**
* Switch to async job, Store file instead of direct download.

---

## 14. Mindset Reminder & Cross-Domain Mapping

**Concept Mapping**

| Automation / Electrical | Software System        |
| ----------------------- | ---------------------- |
| Sensor                  | Data Source            |
| PLC                     | NestJS (Backend Logic) |
| Wiring / Communication  | MQTT / HTTP            |
| SCADA / HMI             | Next.js (Frontend)     |
| Historian               | PostgreSQL / Supabase  |
| Panel Control           | API Layer              |

**System Behavior Perspective**
Must handle probabilistic network behaviors (latency, connection drops) vs the deterministic nature of standard PLCs. Design system for **Failure**, not just normal operation.

---

## 15. AI-Orchestrated Development Workflow

### Objective
Maximize AI resource utilization while maintaining clear structure, defined roles, scalable workflow, and minimal token waste.

**AI Role Definition:**
* **Execution Engine (Gemini-like):** Boilerplate code, CRUD, UI generation. Fast, high output, medium precision.
* **Thinking Engine (Claude-like):** Architecture, Debugging, RCA. Slow, deep reasoning, high precision.

**Project Structure Guidelines:**
```text
/project-root
├── /src       → Final production code
├── /draft     → Raw generated code
├── /analysis  → Reasoning & review
├── /tests     → Testing
└── README.md
```

### Core Workflow Loop
1. Generate → `/draft`
2. Filter → select best output
3. Analyze → `/analysis`
4. Finalize → move to `/src`
5. Commit → Git
6. Deploy → Vercel
7. Validate → repeat

**Final Principle:**
Use AI based on task, not preference. AI is not a replacement for engineering, it is a force multiplier.
