# 📘 Learn Aqua-AI — Part 5: AI/ML Pipeline

## Overview

The AI component lives in `ai-models/train_model.py`. It trains machine learning models that can **predict future water quality values** at any monitoring location.

---

## The `WaterQualityPredictor` Class

The entire AI pipeline is inside one class with clear responsibilities:

```python
class WaterQualityPredictor:
    def load_data()           # Load data from SQLite database
    def preprocess_data()     # Clean, transform, engineer features
    def train_models()        # Train Random Forest & Gradient Boosting
    def train_neural_network() # Train a TensorFlow neural network
    def predict_pollution_risk()  # Make predictions for any location
    def save_models()         # Save trained models to disk
    def load_models()         # Load trained models for inference
```

---

## Step 1: Load Data

```python
def load_data(self) -> pd.DataFrame:
    conn = sqlite3.connect(self.data_path)
    query = """
    SELECT location_name, state, district, latitude, longitude,
           parameter, value, unit, measurement_date
    FROM water_quality_readings WHERE value IS NOT NULL
    """
    df = pd.read_sql_query(query, conn)
```

If the database doesn't exist (first time setup), it **generates sample data** automatically with realistic values for 6 Indian rivers:

- Ganga (Varanasi), Yamuna (Delhi), Godavari (Nashik)
- Krishna (Vijayawada), Narmada (Jabalpur), Brahmaputra (Guwahati)

The sample data has **seasonal variation** — pollution levels change with time of year:

```python
seasonal_factor = 1 + 0.3 * sin(2π * day_of_year / 365)
```

This mimics real-world patterns where monsoon season increases runoff and pollution.

---

## Step 2: Preprocess Data (Feature Engineering)

Raw data needs to be transformed before ML models can use it.

### Time Features

```python
df['year'] = df['measurement_date'].dt.year
df['month'] = df['measurement_date'].dt.month
df['day_of_year'] = df['measurement_date'].dt.dayofyear
```

Extracting time components helps the model learn seasonal patterns.

### Pivot Table

Instead of:

```
Location  | Parameter | Value
Ganga     | BOD       | 4.5
Ganga     | pH        | 7.2
```

We transform to:

```
Location  | BOD | pH  | TDS | DO | ...
Ganga     | 4.5 | 7.2 | 400 | 5.5
```

This gives each row ALL parameters for that location/date combination.

### Label Encoding

ML models can't work with text strings like "Delhi" or "Ganga". We convert them to numbers:

```python
LabelEncoder()
# "Delhi" → 0, "Ganga" → 1, "Yamuna" → 2, etc.
```

### Feature Engineering: Pollution Index

A custom composite feature:

```python
pollution_index = BOD × 0.3 + TDS × 0.0001 + Lead × 100 + Mercury × 1000
```

This combines multiple parameters into one "how polluted is it?" score, weighted by severity.

### StandardScaler

Normalize all feature values to have **mean = 0** and **standard deviation = 1**:

```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

Without scaling, features with large values (TDS ~500) would dominate features with small values (Mercury ~0.001).

---

## Step 3: Train Models

For EACH water quality parameter (BOD, TDS, pH, etc.), we train **two models** and pick the best one:

### Model 1: Random Forest Regressor

```python
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
```

- **How it works:** Creates 100 decision trees, each trained on random subsets of data. The final prediction is the average of all trees.
- **Why use it:** Very robust, handles non-linear relationships, resistant to overfitting.

### Model 2: Gradient Boosting Regressor

```python
gb_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
```

- **How it works:** Builds trees sequentially. Each new tree corrects the errors of the previous ones.
- **Why use it:** Often more accurate than Random Forest, great at capturing subtle patterns.

### Model Selection

```python
if rf_score > gb_score:
    best_model = rf_model   # Random Forest wins
else:
    best_model = gb_model   # Gradient Boosting wins
```

We compare using **R² score** (how well the model explains variance in the data):

- R² = 1.0 → Perfect predictions
- R² = 0.0 → No better than guessing the mean
- R² < 0.0 → Worse than guessing the mean

---

## Step 4: Neural Network (TensorFlow/Keras)

For more complex patterns, we also have a neural network option:

```python
model = keras.Sequential([
    layers.Dense(128, activation='relu'),   # 128 neurons
    layers.Dropout(0.3),                     # Randomly drop 30% to prevent overfitting
    layers.Dense(64, activation='relu'),     # 64 neurons
    layers.Dropout(0.3),
    layers.Dense(32, activation='relu'),     # 32 neurons
    layers.Dense(1)                          # Single output (predicted value)
])
```

**Architecture explained:**

- **Dense(128)** — Fully connected layer with 128 neurons
- **ReLU** — Activation function: `f(x) = max(0, x)` (introduces non-linearity)
- **Dropout(0.3)** — During training, randomly disables 30% of neurons to prevent overfitting
- Final layer has **1 output** — the predicted water quality value

**Training:**

- **Optimizer:** Adam (adaptive learning rate)
- **Loss function:** MSE (Mean Squared Error) — penalizes large prediction errors
- **Epochs:** 50 passes through the training data
- **Batch size:** 32 samples per gradient update

---

## Step 5: Making Predictions

```python
def predict_pollution_risk(self, location_data):
    # Input: { location_name, state, latitude, longitude, month, ... }
    # Output: {
    #   "BOD": { predicted_value: 4.2, confidence: 0.85, risk_level: "medium" },
    #   "pH": { predicted_value: 7.1, confidence: 0.92, risk_level: "low" },
    #   ...
    # }
```

The risk level is determined by comparing the predicted value against thresholds:

```python
# For most parameters (higher = worse):
if value <= safe_limit:    return 'low'
if value <= moderate_limit: return 'medium'
else:                       return 'high'

# For DO (Dissolved Oxygen) — higher = better:
if value >= safe_limit:    return 'low'
if value >= moderate_limit: return 'medium'
else:                       return 'high'

# For pH — range-based:
if 6.5 <= value <= 8.5:   return 'low'
```

---

## Step 6: Saving & Loading Models

Models are saved using `joblib` (efficient binary serialization):

```python
joblib.dump(model_info, "models/BOD_model.joblib")
joblib.dump(self.scalers, "models/scalers.joblib")
joblib.dump(self.encoders, "models/encoders.joblib")
```

Metadata is saved as JSON:

```json
{
  "feature_columns": ["latitude", "longitude", "month", ...],
  "target_columns": ["BOD", "TDS", "pH", ...],
  "model_version": "2024-09-15T10:30:00",
  "training_date": "2024-09-15"
}
```

---

## Key ML Concepts to Know for the Hackathon

| Concept                 | What It Means                                              |
| ----------------------- | ---------------------------------------------------------- |
| **Training Data**       | Historical water quality readings used to teach the model  |
| **Features**            | Input variables (latitude, month, existing parameters)     |
| **Target**              | What we're predicting (future parameter value)             |
| **Train/Test Split**    | 80% data for training, 20% for testing accuracy            |
| **R² Score**            | How well the model's predictions match reality (0-1)       |
| **Overfitting**         | Model memorizes training data instead of learning patterns |
| **Feature Engineering** | Creating new input variables from existing data            |
| **Cross-Validation**    | Testing model on multiple different splits for reliability |

---

## Next Steps

Continue to:

- **Part 6**: [Data Pipeline](./LEARN_06_DATA_PIPELINE.md) — How we fetch government data
- **Part 7**: [DevOps & Deployment](./LEARN_07_DEVOPS.md) — Docker, CI/CD
