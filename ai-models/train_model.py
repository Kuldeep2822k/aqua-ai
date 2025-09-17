"""
Predictive AI Model for Water Quality
Trains machine learning models to predict water pollution events and identify hotspots
"""

import os
import sys
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import logging
from pathlib import Path

# ML Libraries
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.impute import SimpleImputer
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# Data processing
import sqlite3
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WaterQualityPredictor:
    """Main class for training water quality prediction models"""
    
    def __init__(self, data_path: str = "../data-pipeline/water_quality_data.db"):
        self.data_path = data_path
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        self.target_columns = []
        
        # Create models directory
        self.model_dir = Path("models")
        self.model_dir.mkdir(exist_ok=True)
    
    def load_data(self) -> pd.DataFrame:
        """Load data from SQLite database"""
        try:
            conn = sqlite3.connect(self.data_path)
            
            query = """
            SELECT 
                location_name,
                state,
                district,
                latitude,
                longitude,
                parameter,
                value,
                unit,
                measurement_date,
                source
            FROM water_quality_readings
            WHERE value IS NOT NULL
            ORDER BY measurement_date DESC
            """
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            logger.info(f"Loaded {len(df)} records from database")
            return df
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            # Return sample data for development
            return self._generate_sample_data()
    
    def _generate_sample_data(self) -> pd.DataFrame:
        """Generate sample data for development/testing"""
        logger.info("Generating sample water quality data for model training")
        
        np.random.seed(42)
        
        # Indian states and major rivers/cities
        locations = [
            ("Ganga", "Uttar Pradesh", "Varanasi", 25.3176, 82.9739),
            ("Yamuna", "Delhi", "Delhi", 28.6139, 77.2090),
            ("Godavari", "Maharashtra", "Nashik", 19.9975, 73.7898),
            ("Krishna", "Karnataka", "Vijayawada", 16.5062, 80.6480),
            ("Narmada", "Madhya Pradesh", "Jabalpur", 23.1815, 79.9864),
            ("Brahmaputra", "Assam", "Guwahati", 26.1445, 91.7362)
        ]
        
        parameters = ["BOD", "TDS", "pH", "DO", "Lead", "Mercury", "Coliform", "Nitrates"]
        
        data = []
        start_date = datetime(2020, 1, 1)
        
        for i in range(5000):  # Generate 5000 sample records
            location = np.random.choice(locations)
            parameter = np.random.choice(parameters)
            
            # Generate realistic water quality values
            base_values = {
                "BOD": np.random.normal(4.5, 2.0),
                "TDS": np.random.normal(400, 150),
                "pH": np.random.normal(7.5, 1.0),
                "DO": np.random.normal(5.5, 1.5),
                "Lead": np.random.lognormal(-4, 1),
                "Mercury": np.random.lognormal(-6, 0.5),
                "Coliform": np.random.lognormal(2, 1),
                "Nitrates": np.random.normal(25, 10)
            }
            
            # Add seasonal variation
            date = start_date + timedelta(days=np.random.randint(0, 1460))
            seasonal_factor = 1 + 0.3 * np.sin(2 * np.pi * date.timetuple().tm_yday / 365)
            
            value = max(0, base_values[parameter] * seasonal_factor)
            
            data.append({
                'location_name': location[0],
                'state': location[1],
                'district': location[2],
                'latitude': location[3],
                'longitude': location[4],
                'parameter': parameter,
                'value': value,
                'measurement_date': date.strftime('%Y-%m-%d'),
                'source': 'sample_data'
            })
        
        return pd.DataFrame(data)
    
    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Preprocess data for machine learning"""
        logger.info("Preprocessing data for ML training")
        
        # Convert date column
        df['measurement_date'] = pd.to_datetime(df['measurement_date'])
        
        # Extract time features
        df['year'] = df['measurement_date'].dt.year
        df['month'] = df['measurement_date'].dt.month
        df['day_of_year'] = df['measurement_date'].dt.dayofyear
        
        # Pivot table to get parameters as columns
        df_pivot = df.pivot_table(
            index=['location_name', 'state', 'district', 'latitude', 'longitude', 
                   'measurement_date', 'year', 'month', 'day_of_year'],
            columns='parameter',
            values='value',
            aggfunc='mean'
        ).reset_index()
        
        # Fill missing values
        imputer = SimpleImputer(strategy='median')
        parameter_cols = [col for col in df_pivot.columns if col not in 
                         ['location_name', 'state', 'district', 'latitude', 'longitude', 
                          'measurement_date', 'year', 'month', 'day_of_year']]
        
        df_pivot[parameter_cols] = imputer.fit_transform(df_pivot[parameter_cols])
        
        # Encode categorical variables
        for col in ['location_name', 'state', 'district']:
            if col in df_pivot.columns:
                le = LabelEncoder()
                df_pivot[f'{col}_encoded'] = le.fit_transform(df_pivot[col].astype(str))
                self.encoders[col] = le
        
        # Feature engineering
        df_pivot['pollution_index'] = (
            df_pivot.get('BOD', 0) * 0.3 +
            df_pivot.get('TDS', 0) * 0.0001 +
            df_pivot.get('Lead', 0) * 100 +
            df_pivot.get('Mercury', 0) * 1000
        )
        
        # Define features and targets
        feature_cols = ['latitude', 'longitude', 'year', 'month', 'day_of_year',
                       'location_name_encoded', 'state_encoded', 'district_encoded']
        feature_cols.extend([col for col in parameter_cols if col in df_pivot.columns])
        
        self.feature_columns = [col for col in feature_cols if col in df_pivot.columns]
        self.target_columns = parameter_cols
        
        X = df_pivot[self.feature_columns]
        y = df_pivot[self.target_columns]
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers['features'] = scaler
        
        X_scaled_df = pd.DataFrame(X_scaled, columns=self.feature_columns)
        
        logger.info(f"Preprocessed data: {len(X_scaled_df)} samples, {len(self.feature_columns)} features")
        
        return X_scaled_df, y
    
    def train_models(self, X: pd.DataFrame, y: pd.DataFrame):
        """Train multiple ML models for different parameters"""
        logger.info("Training machine learning models")
        
        for target in self.target_columns:
            if target not in y.columns:
                continue
                
            logger.info(f"Training model for {target}")
            
            # Remove rows with NaN targets
            mask = ~y[target].isna()
            X_target = X[mask]
            y_target = y[target][mask]
            
            if len(X_target) < 100:  # Skip if too few samples
                logger.warning(f"Skipping {target}: insufficient data ({len(X_target)} samples)")
                continue
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_target, y_target, test_size=0.2, random_state=42
            )
            
            # Train Random Forest
            rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
            rf_model.fit(X_train, y_train)
            
            # Train Gradient Boosting
            gb_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
            gb_model.fit(X_train, y_train)
            
            # Evaluate models
            rf_score = rf_model.score(X_test, y_test)
            gb_score = gb_model.score(X_test, y_test)
            
            # Choose best model
            if rf_score > gb_score:
                best_model = rf_model
                model_type = 'RandomForest'
                best_score = rf_score
            else:
                best_model = gb_model
                model_type = 'GradientBoosting'
                best_score = gb_score
            
            self.models[target] = {
                'model': best_model,
                'type': model_type,
                'score': best_score,
                'feature_importance': dict(zip(self.feature_columns, 
                                             best_model.feature_importances_))
            }
            
            logger.info(f"{target}: {model_type} model, R² = {best_score:.3f}")
    
    def train_neural_network(self, X: pd.DataFrame, y: pd.DataFrame, target: str):
        """Train neural network for specific target"""
        if target not in y.columns:
            return None
        
        # Prepare data
        mask = ~y[target].isna()
        X_target = X[mask].values
        y_target = y[target][mask].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_target, y_target, test_size=0.2, random_state=42
        )
        
        # Build neural network
        model = keras.Sequential([
            layers.Dense(128, activation='relu', input_shape=(X_train.shape[1],)),
            layers.Dropout(0.3),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(32, activation='relu'),
            layers.Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        
        # Train model
        history = model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_split=0.2,
            verbose=0
        )
        
        # Evaluate
        test_loss, test_mae = model.evaluate(X_test, y_test, verbose=0)
        
        return {
            'model': model,
            'history': history,
            'test_loss': test_loss,
            'test_mae': test_mae
        }
    
    def predict_pollution_risk(self, location_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict pollution risk for a specific location"""
        predictions = {}
        
        # Prepare input data
        input_data = pd.DataFrame([location_data])
        
        # Encode categorical variables
        for col, encoder in self.encoders.items():
            if col in input_data.columns:
                try:
                    input_data[f'{col}_encoded'] = encoder.transform(input_data[col].astype(str))
                except ValueError:
                    input_data[f'{col}_encoded'] = 0  # Unknown category
        
        # Ensure all feature columns are present
        for col in self.feature_columns:
            if col not in input_data.columns:
                input_data[col] = 0
        
        # Scale features
        X_scaled = self.scalers['features'].transform(input_data[self.feature_columns])
        
        # Make predictions
        for parameter, model_info in self.models.items():
            try:
                pred = model_info['model'].predict(X_scaled)[0]
                confidence = model_info['score']
                
                # Determine risk level based on parameter thresholds
                risk_level = self._determine_risk_level(parameter, pred)
                
                predictions[parameter] = {
                    'predicted_value': pred,
                    'confidence': confidence,
                    'risk_level': risk_level,
                    'model_type': model_info['type']
                }
                
            except Exception as e:
                logger.error(f"Error predicting {parameter}: {str(e)}")
                continue
        
        return predictions
    
    def _determine_risk_level(self, parameter: str, value: float) -> str:
        """Determine risk level based on parameter value"""
        thresholds = {
            'BOD': {'safe': 3, 'moderate': 6, 'high': 10},
            'TDS': {'safe': 500, 'moderate': 1000, 'high': 1500},
            'pH': {'safe_min': 6.5, 'safe_max': 8.5, 'moderate_range': 1.0},
            'DO': {'safe': 6, 'moderate': 4, 'high': 2},
            'Lead': {'safe': 0.01, 'moderate': 0.05, 'high': 0.1},
            'Mercury': {'safe': 0.001, 'moderate': 0.005, 'high': 0.01},
            'Coliform': {'safe': 2.2, 'moderate': 10, 'high': 50},
            'Nitrates': {'safe': 45, 'moderate': 100, 'high': 200}
        }
        
        if parameter not in thresholds:
            return 'unknown'
        
        thresh = thresholds[parameter]
        
        if parameter == 'pH':
            if thresh['safe_min'] <= value <= thresh['safe_max']:
                return 'low'
            elif (thresh['safe_min'] - thresh['moderate_range'] <= value <= thresh['safe_min'] or
                  thresh['safe_max'] <= value <= thresh['safe_max'] + thresh['moderate_range']):
                return 'medium'
            else:
                return 'high'
        elif parameter == 'DO':
            if value >= thresh['safe']:
                return 'low'
            elif value >= thresh['moderate']:
                return 'medium'
            else:
                return 'high'
        else:
            if value <= thresh['safe']:
                return 'low'
            elif value <= thresh['moderate']:
                return 'medium'
            else:
                return 'high'
    
    def save_models(self):
        """Save trained models to disk"""
        logger.info("Saving models to disk")
        
        # Save scikit-learn models
        for parameter, model_info in self.models.items():
            model_path = self.model_dir / f"{parameter}_model.joblib"
            joblib.dump(model_info, model_path)
        
        # Save preprocessors
        joblib.dump(self.scalers, self.model_dir / "scalers.joblib")
        joblib.dump(self.encoders, self.model_dir / "encoders.joblib")
        
        # Save metadata
        metadata = {
            'feature_columns': self.feature_columns,
            'target_columns': self.target_columns,
            'model_version': datetime.now().isoformat(),
            'training_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        with open(self.model_dir / "metadata.json", 'w') as f:
            import json
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Models saved to {self.model_dir}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            # Load models
            for model_file in self.model_dir.glob("*_model.joblib"):
                parameter = model_file.stem.replace('_model', '')
                self.models[parameter] = joblib.load(model_file)
            
            # Load preprocessors
            self.scalers = joblib.load(self.model_dir / "scalers.joblib")
            self.encoders = joblib.load(self.model_dir / "encoders.joblib")
            
            # Load metadata
            with open(self.model_dir / "metadata.json", 'r') as f:
                import json
                metadata = json.load(f)
                self.feature_columns = metadata['feature_columns']
                self.target_columns = metadata['target_columns']
            
            logger.info(f"Loaded {len(self.models)} models")
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            return False

def main():
    """Main training function"""
    predictor = WaterQualityPredictor()
    
    # Load data
    df = predictor.load_data()
    
    if df.empty:
        logger.error("No data available for training")
        return
    
    # Preprocess data
    X, y = predictor.preprocess_data(df)
    
    # Train models
    predictor.train_models(X, y)
    
    # Save models
    predictor.save_models()
    
    # Test prediction
    sample_location = {
        'location_name': 'Ganga',
        'state': 'Uttar Pradesh',
        'district': 'Varanasi',
        'latitude': 25.3176,
        'longitude': 82.9739,
        'year': 2024,
        'month': 9,
        'day_of_year': 256
    }
    
    predictions = predictor.predict_pollution_risk(sample_location)
    logger.info(f"Sample prediction: {predictions}")
    
    logger.info("Model training completed successfully!")

if __name__ == "__main__":
    main()
