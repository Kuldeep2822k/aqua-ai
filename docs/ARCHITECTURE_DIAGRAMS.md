# 🏗️ AQUA-AI Architecture Diagrams

Complete visual documentation of system architecture, security, deployment, and operational flows.

---

## 🌐 System Architecture

High-level overview of the complete system architecture showing all major components and their interactions.

```mermaid
flowchart TB
  subgraph Frontend[Frontend Layer]
    FE1[React + TypeScript]
    FE2[Leaflet Maps]
    FE3[Real-time Dashboard]
  end

  subgraph API[API Gateway]
    API1[Node.js + Express]
    API2[Authentication]
    API3[Rate Limiting]
  end

  subgraph Data[Data Layer]
    DB1[PostgreSQL + PostGIS]
    DB2[SQLite Dev Storage]
    DB3[Government APIs]
    DB4[Redis Cache]
  end

  subgraph ML[AI/ML Pipeline]
    ML1[Python ML Models]
    ML2[Feature Engineering]
    ML3[Prediction Engine]
  end

  subgraph ETL[ETL + Data Pipeline]
    ETL1[Python ETL]
    ETL2[Validation + Cleaning]
    ETL3[Scheduler]
  end

  subgraph Obs[Observability + Alerts]
    O1[Winston Logs]
    O2[Sentry Errors]
    O3[Performance Monitoring]
    O4[Alerting]
  end

  FE1 --> API1
  FE2 --> API1
  FE3 --> API1
  API1 --> API2
  API1 --> API3
  API1 --> DB1
  API1 --> DB2
  API1 --> DB4
  DB4 --> API1
  DB3 --> ETL1 --> ETL2 --> DB1
  ETL2 --> DB2
  ETL3 --> ETL1
  DB1 --> ML1
  DB2 --> ML1
  ML1 --> ML2 --> ML3 --> DB1
  API1 --> O1
  API1 --> O2
  API1 --> O3
  ML3 --> O4
  DB1 --> O4
```

---

## 📊 Data Flow Architecture

End-to-end data flow from government sources through ETL pipelines to user-facing delivery.

```mermaid
flowchart LR
  subgraph Sources[Data Sources]
    S1[CPCB APIs]
    S2[Jal Shakti Data]
    S3[Open Government Data]
    S4[Community Reports]
  end

  subgraph Ingestion[ETL + Data Pipeline]
    P1[Fetch + Normalize]
    P2[Validation + Cleaning]
    P3[Enrichment + Geocoding]
    P4[Scheduler]
  end

  subgraph Storage[Storage]
    T1[PostgreSQL + PostGIS]
    T2[SQLite Dev DB]
    T3[Redis Cache]
  end

  subgraph Analytics[Analytics + AI]
    A1[Feature Store]
    A2[Model Training]
    A3[Risk Predictions]
  end

  subgraph Alerting[Alerts]
    AL1[Threshold Engine]
    AL2[Alert Store]
    AL3[Notification Service]
  end

  subgraph Delivery[Delivery]
    D1[REST API]
    D2[Realtime Dashboard]
    D3[Map Visualization]
  end

  Sources --> P1 --> P2 --> P3 --> Storage
  P4 --> P1
  T1 --> A1 --> A2 --> A3 --> T1
  T2 --> A1
  T1 --> AL1 --> AL2 --> D1
  D1 --> AL3
  T1 --> D1 --> D2
  T1 --> D3
  D1 --> T3
  T3 --> D1
```

---

## 🔒 Security Architecture

Multi-layered security controls from edge protection to data security.

```mermaid
flowchart TB
  subgraph Clients[Clients]
    C1[Browser App]
    C2[Admin Console]
  end

  subgraph Edge[Ingress Controls]
    E1[HTTPS + TLS]
    E2[CORS Policy]
    E3[Rate Limiting]
  end

  subgraph Auth[Auth + Access]
    A1[JWT Auth]
    A2[RBAC Roles]
    A3[Session Controls]
  end

  subgraph App[Application Security]
    S1[Input Validation]
    S2[Sanitization]
    S3[Security Headers]
    S4[HPP + XSS Protection]
  end

  subgraph DataSec[Data Security]
    D1[Least Privilege DB User]
    D2[Audit Logs]
    D3[Encrypted Secrets]
    D4[Monitoring + Logs]
    D5[Backup + Recovery]
  end

  Clients --> Edge --> Auth --> App --> DataSec
```

---

## 🚀 Deployment Architecture

Development to production deployment pipeline and infrastructure.

```mermaid
flowchart TB
  subgraph Dev[Developer Workstations]
    D1[Frontend]
    D2[Backend]
    D3[Data Pipeline]
  end

  subgraph CI[CI/CD]
    C1[GitHub Actions]
    C2[Build + Test]
    C3[Deploy]
  end

  subgraph Hosting[Hosting]
    H1[Render Frontend]
    H2[Render Backend]
  end

  subgraph DataInfra[Data Infrastructure]
    I1[Supabase Postgres + PostGIS]
    I2[Scheduled Pipeline]
  end

  D1 --> C1
  D2 --> C1
  D3 --> C1
  C1 --> C2 --> C3
  C3 --> H1
  C3 --> H2
  H2 --> I1
  I2 --> I1
```

---

## ⚙️ CI/CD Pipeline

Automated continuous integration and deployment workflow.

```mermaid
flowchart LR
  P1[Push or PR] --> P2[Lint]
  P2 --> P3[Unit Tests]
  P3 --> P4[Build Frontend]
  P4 --> P5[Build Backend]
  P5 --> P6[Deploy to Render]
  P6 --> P7[Schedule Data Pipeline]
```

---

## 🗄️ Database ER Diagram

Database schema showing entity relationships and foreign key constraints.

```mermaid
erDiagram
  USERS {
    uuid id PK
    string email
    string password_hash
    string role
    timestamp created_at
  }

  LOCATIONS {
    uuid id PK
    string name
    string state
    point geom
  }

  WATER_QUALITY_PARAMETERS {
    uuid id PK
    string name
    string unit
    float safe_threshold
  }

  WATER_QUALITY_READINGS {
    uuid id PK
    uuid location_id FK
    uuid parameter_id FK
    float value
    timestamp recorded_at
  }

  AI_PREDICTIONS {
    uuid id PK
    uuid location_id FK
    string risk_level
    float confidence
    timestamp predicted_at
  }

  ALERTS {
    uuid id PK
    uuid location_id FK
    string alert_status
    timestamp created_at
  }

  LOCATIONS ||--o{ WATER_QUALITY_READINGS : has
  WATER_QUALITY_PARAMETERS ||--o{ WATER_QUALITY_READINGS : defines
  LOCATIONS ||--o{ AI_PREDICTIONS : generates
  LOCATIONS ||--o{ ALERTS : triggers
```

---

## 🔄 Runtime Sequence Diagram

Detailed request flow showing interactions between system components.

```mermaid
sequenceDiagram
  participant User
  participant UI as Frontend UI
  participant API as API Gateway
  participant Auth as Auth Middleware
  participant Valid as Validation
  participant DB as Postgres + PostGIS
  participant Cache as Redis Cache
  participant ML as Prediction Engine
  participant Alerts as Alerting
  participant Obs as Monitoring

  User->>UI: Open dashboard
  UI->>API: GET /api/locations
  API->>Auth: Verify JWT
  Auth-->>API: OK
  API->>Valid: Validate request
  Valid-->>API: OK
  API->>Cache: Read cached locations
  alt Cache hit
    Cache-->>API: Locations
  else Cache miss
    API->>DB: Query locations
    DB-->>API: Locations
    API->>Cache: Store locations
  end
  API->>Obs: Log request metrics
  API-->>UI: Locations response

  UI->>API: GET /api/predictions/risk-map
  API->>Auth: Verify JWT
  Auth-->>API: OK
  API->>DB: Fetch latest readings
  API->>ML: Request predictions
  ML-->>API: Risk scores
  API->>Alerts: Evaluate thresholds
  Alerts-->>API: Active alerts
  API->>Obs: Log prediction latency
  API-->>UI: Risk map payload
  UI-->>User: Render map + alerts
```

---

## 📋 Data Governance Architecture

Data quality, lineage tracking, and governance controls.

```mermaid
flowchart LR
  subgraph Governance[Governance + Quality]
    G1[Data Catalog]
    G2[Lineage Tracker]
    G3[Quality Scoring]
    G4[Retention Policies]
    G5[PII Classification]
  end

  subgraph Sources[Data Sources]
    S1[Government APIs]
    S2[Community Inputs]
  end

  subgraph Pipeline[ETL + Storage]
    P1[Ingestion]
    P2[Validation]
    P3[Postgres + PostGIS]
    P4[Archive Storage]
  end

  Sources --> P1 --> P2 --> P3
  P1 --> G2
  P2 --> G3
  P3 --> G1
  P3 --> G4 --> P4
  P1 --> G5
```

---

## 🛡️ Security Depth Architecture

Defense-in-depth security layers including edge protection and secrets management.

```mermaid
flowchart TB
  subgraph Edge[Edge Protection]
    E1[WAF]
    E2[DDoS Mitigation]
    E3[TLS Termination]
  end

  subgraph Secrets[Secrets + Keys]
    S1[Secrets Manager]
    S2[KMS]
    S3[Key Rotation]
  end

  subgraph App[Application]
    A1[API Gateway]
    A2[Auth Service]
    A3[Rate Limiting]
  end

  Edge --> App
  Secrets --> App
  S2 --> S3
```

---

## 🔄 Operational Resilience Architecture

High availability setup with failover and disaster recovery capabilities.

```mermaid
flowchart TB
  subgraph Primary[Primary Region]
    P1[Frontend]
    P2[Backend]
    P3[Primary DB]
  end

  subgraph Secondary[Secondary Region]
    S1[Standby Backend]
    S2[Read Replica]
    S3[Static Failover Site]
  end

  subgraph Recovery[Recovery]
    R1[Backups + Snapshots]
    R2[Restore Playbooks]
    R3[Failover Runbook]
  end

  P2 --> P3
  P3 --> S2
  S2 --> S1
  P1 --> S3
  P3 --> R1 --> R2
  R2 --> R3
  R3 --> S1
```

---

## 👤 User Journey Diagram

Typical user flow through the application from login to report generation.

```mermaid
flowchart LR
  U1[User] --> U2[Open Dashboard]
  U2 --> U3[Authenticate]
  U3 --> U4[View Map]
  U4 --> U5[Select Location]
  U5 --> U6[View Analytics]
  U6 --> U7[Receive Alerts]
  U7 --> U8[Download Report]
```

---

## ⚠️ Threat Model Diagram

Security threats, protective controls, and expected outcomes.

```mermaid
flowchart TB
  subgraph Threats[Attack Surface]
    T1[Injection]
    T2[XSS]
    T3[Credential Abuse]
    T4[Rate Abuse]
  end

  subgraph Controls[Controls]
    C1[Validation + Sanitization]
    C2[HPP + XSS Protection]
    C3[JWT + RBAC]
    C4[Rate Limiting + WAF]
  end

  subgraph Outcomes[Outcomes]
    O1[Rejected Requests]
    O2[Blocked Actors]
    O3[Audit Trail]
  end

  Threats --> Controls --> Outcomes
```

---

<div align="center">

**Built with ❤️ for India's Water Security**

[Back to Main README](../README.md)

</div>
