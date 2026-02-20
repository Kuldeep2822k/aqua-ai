# Prediction Model Project Plan

## 1) Project Scope

**Objective:** Deliver a polished, demo-ready water-quality prediction model integrated with the Aqua-AI stack (data pipeline + ML training + API serving), optimized for hackathon presentation and resume highlight.

**Timeline:** 4 weeks total (Weeks 1–4).

**Responsible Team Members:**

- Project Owner (you): Defines scope, requirements, and demo narrative.
- ML Engineer (you): Model architecture, training, evaluation.
- Data Engineer (you): Data ingestion, preprocessing, feature pipelines.
- Backend Engineer (you): Model serving API integration, storage.
- DevOps Engineer (you): Deployment automation, monitoring.
- QA Engineer (you): Test strategy, validation, release gating.

**Required Resources:**

- Compute: Laptop with RTX 3050 4 GB VRAM, Ryzen 7 7345HS, 16 GB RAM (CPU-first training with optional small GPU runs).
- Storage: 50 GB local data store + 5 GB model registry.
- Access: Government data APIs and internal database (PostgreSQL + PostGIS, SQLite for dev).
- Tooling: Python 3.11, scikit-learn, TensorFlow (future), Pandas, NumPy, MLflow or equivalent registry.

**Technical Specifications:**

- Primary task: Risk-level classification (Low/Medium/High) with calibrated probabilities.
- Secondary task: Regression for key parameters (BOD, pH, TDS) for explainability.
- Inference latency target: < 500 ms per request at P95 (demo workloads).
- Model format: `.pkl` (scikit-learn) with versioned metadata.
- Data freshness: Weekly model refresh; on-demand inference for demos.

**Quality Assurance Checkpoints:**

- Scope review sign-off at end of Week 1.
- Architecture and data lineage review at end of Week 2.
- Baseline model acceptance at end of Week 3.
- Demo readiness review at end of Week 4.

## 2) Data Requirements

**Timeline:** Weeks 1–2 (data discovery, acquisition, validation).

**Responsible Team Members:**

- Data Engineer (lead), ML Lead, QA Engineer (all you).

**Required Resources:**

- Data pipeline scripts under `data-pipeline/`.
- Access to historical water-quality datasets and location metadata.
- Data validation tooling (Great Expectations or in-house checks).

**Technical Specifications:**

- Minimum 6–12 months of historical data per location (downsample if storage or training time is constrained).
- Required fields: timestamp, location_id, latitude, longitude, parameter values, source metadata.
- Missingness tolerance: < 10% per feature after cleaning.
- Outlier thresholds defined per parameter (domain rules + z-score).

**Quality Assurance Checkpoints:**

- Data schema validation report.
- Source coverage matrix approved by Product Owner.
- Data quality dashboard showing completeness and drift baseline.

### 2.1 Data Preprocessing Steps

**Timeline:** Weeks 1–2.

**Responsible Team Members:** Data Engineer, ML Lead.

**Steps:**

- Deduplicate readings by location_id + timestamp.
- Normalize units and apply parameter-specific calibration.
- Impute missing values using time-based interpolation or KNN.
- Remove outliers using domain thresholds and robust statistics.
- Encode categorical metadata (source type, season, region).

**Resources & Specs:**

- Pandas pipelines with reproducible configuration.
- Versioned preprocessing configs in `ai-models/preprocessing/`.

**QA Checkpoints:**

- Preprocessing unit tests with golden samples.
- Data audit logs capturing records removed/altered.

### 2.2 Feature Engineering Approaches

**Timeline:** Weeks 2–3.

**Responsible Team Members:** ML Lead, Data Engineer.

**Approaches:**

- Temporal features: rolling averages (7/30/90 days), trends, seasonal indicators.
- Spatial features: proximity to industrial zones, land use, watershed.
- Interaction terms: parameter ratios and combined risk indices.
- Lag features: previous readings and gradients.

**Resources & Specs:**

- Feature registry with definitions and owners.
- Feature computation cached in SQLite for dev and Postgres for prod.

**QA Checkpoints:**

- Feature distribution checks vs baseline.
- Feature leakage review.

## 3) Model Selection Criteria

**Timeline:** Weeks 2–3 (parallel to feature engineering).

**Responsible Team Members:** ML Lead (lead), QA Engineer (you).

**Criteria:**

- Predictive quality: F1 (macro), ROC-AUC, calibration error.
- Interpretability: feature importance and SHAP summaries.
- Latency and footprint: inference < 300 ms, model size < 50 MB.
- Robustness: stable performance across regions and seasons.

**Resources & Specs:**

- Candidate models: Random Forest, Gradient Boosting, XGBoost (optional if time permits and memory allows).
- Cross-validation: 5-fold, time-aware splits.

**QA Checkpoints:**

- Model selection report signed by Product Owner.
- Bias and fairness assessment for geographic clusters.

## 4) Implementation Phases

### Phase 1: Data Pipeline Hardening

**Timeline:** Weeks 1–2.

**Responsible Team Members:** Data Engineer, QA Engineer.

**Resources:** `data-pipeline/` collectors, cleaners, schedulers; Postgres + SQLite.

**Technical Deliverables:**

- Reliable ingestion schedules with retry/backoff.
- Data validation gates before persistence.

**QA Checkpoints:**

- Pipeline integration tests.
- Ingestion SLAs validated (daily data availability).

### Phase 2: Feature Engineering + Baseline Modeling

**Timeline:** Weeks 2–3.

**Responsible Team Members:** ML Lead, Data Engineer.

**Resources:** `ai-models/preprocessing/`, `ai-models/training/`.

**Technical Deliverables:**

- Feature set v1 and baseline model.
- Training scripts with deterministic seeds.

**QA Checkpoints:**

- Reproducibility tests across environments.
- Baseline metric thresholds met (F1 macro ≥ 0.65).

### Phase 3: Advanced Modeling + Validation

**Timeline:** Week 3.

**Responsible Team Members:** ML Lead, QA Engineer.

**Resources:** Model registry, evaluation scripts.

**Technical Deliverables:**

- Tuned model with calibration and confidence scoring.
- Evaluation report with error analysis.

**QA Checkpoints:**

- Validation on holdout geography.
- Drift sensitivity assessment.

### Phase 4: API Integration + Serving

**Timeline:** Week 3.

**Responsible Team Members:** Backend Engineer, ML Lead.

**Resources:** `backend/routes/predictions.js`, model storage.

**Technical Deliverables:**

- Prediction endpoint with model versioning.
- Caching of common requests (Redis).

**QA Checkpoints:**

- API contract tests.
- Load testing to P95 latency target.

### Phase 5: Deployment + Monitoring

**Timeline:** Week 4.

**Responsible Team Members:** DevOps Engineer, QA Engineer.

**Resources:** Docker, CI/CD workflows, monitoring stack.

**Technical Deliverables:**

- Automated model deployment pipeline.
- Monitoring dashboards for quality and drift.

**QA Checkpoints:**

- Production readiness review.
- Rollback procedure tested.

## 5) Model Training Procedures

**Timeline:** Weeks 2–3.

**Responsible Team Members:** ML Lead.

**Procedure:**

- Split data using time-based splits to avoid leakage.
- Train baseline model and iterate with hyperparameter tuning.
- Calibrate probabilities with Platt scaling or isotonic regression.
- Persist model artifacts with training metadata.
- Use lightweight configurations: limited trees, smaller max depth, and subsampling to fit 4 GB VRAM and 16 GB RAM.
- Prefer CPU training with batched feature generation; run GPU only for small experiments.

**Resources & Specs:**

- Training scripts in `ai-models/training/`.
- MLflow or equivalent for run tracking.

**QA Checkpoints:**

- Training reproducibility checks.
- Model artifact integrity verification.

## 6) Validation Methods

**Timeline:** Weeks 3–4.

**Responsible Team Members:** QA Engineer, ML Lead.

**Methods:**

- K-fold time series CV.
- Geographic holdout validation.
- Temporal backtesting on recent months.

**Resources & Specs:**

- Evaluation scripts in `ai-models/evaluation/`.

**QA Checkpoints:**

- Validation metrics sign-off.
- Error analysis report for high-risk cases.

## 7) Performance Evaluation Criteria

**Timeline:** Weeks 3–4.

**Responsible Team Members:** ML Lead, Product Owner.

**Criteria:**

- Classification: F1 macro ≥ 0.70, ROC-AUC ≥ 0.80.
- Calibration: ECE ≤ 0.08.
- Regression: MAE ≤ target thresholds per parameter.
- Operational: P95 inference latency < 300 ms.

**Resources & Specs:**

- Metrics dashboard with weekly reporting.

**QA Checkpoints:**

- Metrics trend review.
- Regression test suite passing.

## 8) Testing Strategy

**Timeline:** Weeks 1–4.

**Responsible Team Members:** QA Engineer (lead), Backend Engineer, ML Lead.

**Testing Layers:**

- Unit tests for preprocessing and feature logic.
- Integration tests for pipeline and API.
- End-to-end tests from data ingestion to prediction output.
- Load and reliability testing for serving endpoints.

**Resources & Specs:**

- Test data fixtures and golden datasets.
- Automated tests in CI.

**QA Checkpoints:**

- Test coverage ≥ 80% for model-related code.
- Zero critical defects before release gate.

## 9) Deployment Considerations

**Timeline:** Week 4.

**Responsible Team Members:** DevOps Engineer, Backend Engineer.

**Considerations:**

- Docker-based model serving with versioned tags.
- Manual promotion to demo environment for model upgrades.
- Configuration management via environment variables.
- Model rollback within 1 hour (manual).

**Resources & Specs:**

- CI/CD pipeline with automated approval gates.
- Secure model artifact storage.

**QA Checkpoints:**

- Deployment dry run in staging.
- Post-deploy smoke tests.

## 10) Post-Deployment Monitoring Requirements

**Timeline:** Week 4, ongoing thereafter.

**Responsible Team Members:** DevOps Engineer, ML Lead.

**Monitoring Requirements:**

- Data drift monitoring: feature distribution changes.
- Prediction quality monitoring: periodic labeled sample evaluation.
- Latency and error rate tracking per endpoint.
- Alerting thresholds for performance regressions.

**Resources & Specs:**

- Monitoring stack with dashboards and alerts.
- Scheduled retraining triggers based on drift (monthly).

**QA Checkpoints:**

- Alert playbooks validated.
- Monthly model health reports.

## 11) Success Metrics

**Timeline:** Week 4 for initial acceptance, ongoing monthly reviews.

**Responsible Team Members:** Product Owner, ML Lead.

**Metrics:**

- Demo impact: Clear, explainable predictions showcased in a 5–10 minute demo.
- Model: F1 macro ≥ 0.70 sustained across holdout splits.
- Ops: ≥ 98% prediction endpoint uptime during demo week.
- Data: ≥ 90% data freshness within 7 days.

**Quality Assurance Checkpoints:**

- Stakeholder acceptance review.
- KPI dashboard signed off for production.
