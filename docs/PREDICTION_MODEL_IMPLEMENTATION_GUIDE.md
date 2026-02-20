# Prediction Model Implementation Guide

This guide converts the steps in the prediction model plan into actionable implementation tasks for a hackathon/personal project. It is designed for a laptop setup with RTX 3050 4 GB, 16 GB RAM, and 50 GB storage.

## Step 1: Project Scope and Environment Setup

**Where to begin**

- Repository root: `d:\aqua-ai`

**Tools and libraries**

- Python 3.11, Pandas, NumPy, scikit-learn
- Node.js for running helper scripts

**Commands**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Expected output**

```
Successfully installed numpy pandas scikit-learn ...
```

**Troubleshooting**

- If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.
- If installs fail, delete `.venv` and recreate it.

**Quality checkpoints**

- `python --version` shows 3.11.x
- `pip list` includes pandas and scikit-learn

## Step 2: Data Requirements and Dataset Acquisition

**Where to begin**

- Data pipeline entrypoint: [fetch_data.py](file:///d:/aqua-ai/data-pipeline/fetch_data.py)
- API config: [config.py](file:///d:/aqua-ai/data-pipeline/config.py)

**Tools and libraries**

- Python, aiohttp, pandas

**Dataset sources**

- data.gov.in water quality dataset (resource id in config)
- CPCB (Central Pollution Control Board) sources
- Jal Shakti datasets
- OpenWeatherMap for weather enrichment

**How to source and download**

- Create API keys:
  - data.gov.in API key
  - OpenWeatherMap API key
- Set environment variables:

```powershell
$env:DATA_GOV_IN_API_KEY="your_key"
$env:DATA_GOV_IN_RESOURCE_ID="19697d76-442e-4d76-aeae-13f8a17c91e1"
$env:WEATHER_API_KEY="your_key"
```

- For demo-only runs without keys:

```powershell
$env:ALLOW_SAMPLE_DATA="true"
```

**Commands**

```powershell
cd data-pipeline
python fetch_data.py
```

**Expected output**

```
Data Fetch Summary:
Water Quality Records: <number>
Weather Records: <number>
Database: PostgreSQL or SQLite (water_quality_data.db)
```

**Troubleshooting**

- If it fails with missing API keys, set `ALLOW_SAMPLE_DATA=true`.
- If Postgres connection fails, SQLite fallback is automatic.
- If rate limits hit, reduce `DATA_GOV_IN_MAX_PAGES` or `DATA_GOV_IN_LIMIT`.

**Quality checkpoints**

- `water_quality_data.db` created when Postgres is not available
- Summary shows non-zero water quality records

## Step 3: Data Preprocessing

**Where to begin**

- Preprocessing directory: `ai-models/preprocessing/`
- Inspect training pipeline: [train_model.py](file:///d:/aqua-ai/ai-models/train_model.py)

**Tools and libraries**

- pandas, numpy, scikit-learn

**How to preprocess and clean**

- Deduplicate on `location_name + measurement_date + parameter`
- Normalize units based on `WATER_QUALITY_PARAMETERS` in config
- Impute missing values using median or KNN
- Remove outliers using parameter-specific thresholds

**Code example**

```python
import pandas as pd
from sklearn.impute import SimpleImputer

df = pd.read_csv("data.csv")
df = df.drop_duplicates(subset=["location_name", "measurement_date", "parameter"])
imputer = SimpleImputer(strategy="median")
df["value"] = imputer.fit_transform(df[["value"]])
```

**Expected output**

```
Rows before: 12000
Rows after: 11520
Missing values after imputation: 0
```

**Troubleshooting**

- If data is sparse, switch to median imputation.
- If outliers are dominating, cap at parameter critical limits.

**Quality checkpoints**

- Missingness < 10%
- No negative values for parameters

## Step 4: Feature Engineering

**Where to begin**

- Feature logic in `ai-models/preprocessing/`

**Tools and libraries**

- pandas, numpy

**Feature approaches**

- Rolling averages (7/30/90 days)
- Lag features
- Seasonal indicators (month, monsoon flag)
- Derived indices (pollution index)

**Code example**

```python
df["month"] = pd.to_datetime(df["measurement_date"]).dt.month
df["value_7d_avg"] = (
  df.groupby("location_name")["value"].transform(lambda s: s.rolling(7, 1).mean())
)
```

**Expected output**

```
Added features: month, value_7d_avg
```

**Troubleshooting**

- If rolling averages produce NaN, use `rolling(7, 1)` minimum periods.

**Quality checkpoints**

- Feature distributions stable compared to raw inputs
- No leakage of future data

## Step 5: Model Selection and Baseline Training

**Where to begin**

- Training script: [train_model.py](file:///d:/aqua-ai/ai-models/train_model.py)

**Tools and libraries**

- scikit-learn RandomForestRegressor, GradientBoostingRegressor

**Training parameters (laptop-safe)**

- RandomForest: `n_estimators=150`, `max_depth=12`, `min_samples_leaf=5`
- GradientBoosting: `n_estimators=200`, `learning_rate=0.05`, `max_depth=3`

**Commands**

```powershell
cd ai-models
python train_model.py
```

**Expected output**

```
Training model for BOD
Best model: RandomForestRegressor
Saved model to ai-models/models/
```

**Troubleshooting**

- If memory spikes, reduce `n_estimators` to 100.
- If training is too slow, use fewer parameters or smaller dataset.

**Quality checkpoints**

- Baseline F1 macro ≥ 0.65 or MAE below parameter thresholds
- Model artifacts saved under `ai-models/models/`

## Step 6: Validation Methods

**Where to begin**

- Evaluation scripts: `ai-models/evaluation/`

**Tools and libraries**

- scikit-learn metrics, cross-validation

**Validation steps**

- Time-based train/validation split
- Geographic holdout by state
- Backtest on last 2–3 months

**Code example**

```python
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5)
scores = cross_val_score(model, X, y, cv=tscv, scoring="neg_mean_absolute_error")
```

**Expected output**

```
CV MAE mean: 0.41
```

**Troubleshooting**

- If scores are unstable, reduce feature count or simplify model.

**Quality checkpoints**

- Validation metrics within target bands
- Error analysis completed for worst locations

## Step 7: Performance Evaluation Criteria

**Where to begin**

- Metrics summary output from training

**Performance criteria**

- F1 macro ≥ 0.70, ROC-AUC ≥ 0.80
- Calibration ECE ≤ 0.08
- P95 inference latency < 500 ms

**Expected output**

```
F1 macro: 0.71
ROC-AUC: 0.82
ECE: 0.07
```

**Troubleshooting**

- If calibration is weak, run isotonic regression on outputs.

**Quality checkpoints**

- All metrics logged for baseline and final models

## Step 8: Testing Strategy

**Where to begin**

- Add tests under `ai-models/tests/` or reuse existing pipeline tests

**Tools and libraries**

- pytest or unittest for Python

**Command**

```powershell
python -m pytest ai-models
```

**Expected output**

```
collected 12 items
12 passed in 2.40s
```

**Troubleshooting**

- If pytest is missing, run `pip install pytest`.

**Quality checkpoints**

- Tests cover preprocessing, feature generation, and prediction outputs

## Step 9: API Integration and Serving

**Where to begin**

- Backend predictions route: `backend/routes/predictions.js`

**Tools and libraries**

- Node.js, Express, model loader utility

**Integration steps**

- Load `ai-models/models/` artifacts
- Add model version to API response
- Validate request payload fields

**Command**

```powershell
cd backend
npm run dev
```

**Expected output**

```
Server running on port 5000
```

**Troubleshooting**

- If model file not found, verify path and filename.
- If response is slow, cache static model data on startup.

**Quality checkpoints**

- API returns prediction, confidence, model version

## Step 10: Deployment and Monitoring

**Where to begin**

- Docker and deployment configs in repo root

**Tools and libraries**

- Docker, GitHub Actions

**Commands**

```powershell
docker-compose up -d
```

**Expected output**

```
Starting aqua-ai-backend ... done
Starting aqua-ai-frontend ... done
```

**Troubleshooting**

- If ports conflict, stop other services or update `docker-compose.yml`.

**Quality checkpoints**

- Service health endpoints respond
- Basic inference requests succeed

## Step 11: Post-Deployment Monitoring and Success Metrics

**Where to begin**

- Monitoring dashboards and logs

**Monitoring requirements**

- Track prediction latency and error rate
- Track drift in feature distributions
- Review model accuracy on labeled samples monthly

**Quality checkpoints**

- Demo week uptime ≥ 98%
- Clear 5–10 minute demo narrative
- Model metrics stable across holdouts
