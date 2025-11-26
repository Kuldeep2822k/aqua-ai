/*
  # Create Water Quality Monitoring Database Schema

  1. New Tables
    - `water_quality_readings` - Main table for storing water quality measurements
    - `monitoring_locations` - Physical locations being monitored
    - `quality_predictions` - AI predictions for future quality metrics
    - `quality_alerts` - Alert system for quality threshold violations
    - `alert_history` - Historical record of all alerts

  2. Features
    - Comprehensive indexing for common queries
    - Proper data types and constraints
    - Timestamps with automatic tracking
    - RLS policies for data security (public read access for demo purposes)

  3. Security
    - Enable RLS on all tables
    - Public read access for core data
    - Timestamp-based audit trail
*/

-- Create water_quality_readings table
CREATE TABLE IF NOT EXISTS water_quality_readings (
  id BIGSERIAL PRIMARY KEY,
  location_id INT NOT NULL,
  parameter TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  measurement_date TIMESTAMPTZ NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  quality_score INT CHECK (quality_score >= 0 AND quality_score <= 100),
  data_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_water_quality_location_id ON water_quality_readings(location_id);
CREATE INDEX idx_water_quality_parameter ON water_quality_readings(parameter);
CREATE INDEX idx_water_quality_measurement_date ON water_quality_readings(measurement_date);
CREATE INDEX idx_water_quality_risk_level ON water_quality_readings(risk_level);

-- Create monitoring_locations table
CREATE TABLE IF NOT EXISTS monitoring_locations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  district TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  water_body_type TEXT,
  water_body_name TEXT,
  population_affected INT DEFAULT 0,
  parameters_monitored TEXT[] DEFAULT '{}',
  last_reading TIMESTAMPTZ,
  avg_wqi_score NUMERIC CHECK (avg_wqi_score >= 0 AND avg_wqi_score <= 100),
  active_alerts INT DEFAULT 0,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_locations_state ON monitoring_locations(state);
CREATE INDEX idx_locations_risk_level ON monitoring_locations(risk_level);
CREATE INDEX idx_locations_coordinates ON monitoring_locations(latitude, longitude);
CREATE INDEX idx_locations_water_body ON monitoring_locations(water_body_name);

-- Create quality_predictions table
CREATE TABLE IF NOT EXISTS quality_predictions (
  id BIGSERIAL PRIMARY KEY,
  location_id INT NOT NULL,
  location_name TEXT,
  parameter TEXT NOT NULL,
  predicted_value NUMERIC,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  prediction_date TIMESTAMPTZ NOT NULL,
  forecast_hours INT,
  model_version TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_predictions_location_id ON quality_predictions(location_id);
CREATE INDEX idx_predictions_parameter ON quality_predictions(parameter);
CREATE INDEX idx_predictions_prediction_date ON quality_predictions(prediction_date);
CREATE INDEX idx_predictions_risk_level ON quality_predictions(risk_level);

-- Create quality_alerts table
CREATE TABLE IF NOT EXISTS quality_alerts (
  id BIGSERIAL PRIMARY KEY,
  location_id INT NOT NULL,
  location_name TEXT,
  state TEXT,
  parameter TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  message TEXT,
  threshold_value NUMERIC,
  actual_value NUMERIC,
  status TEXT CHECK (status IN ('active', 'resolved', 'dismissed')) DEFAULT 'active',
  triggered_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  dismissal_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alerts_location_id ON quality_alerts(location_id);
CREATE INDEX idx_alerts_status ON quality_alerts(status);
CREATE INDEX idx_alerts_severity ON quality_alerts(severity);
CREATE INDEX idx_alerts_triggered_at ON quality_alerts(triggered_at);
CREATE INDEX idx_alerts_parameter ON quality_alerts(parameter);

-- Create alert_history table for audit trail
CREATE TABLE IF NOT EXISTS alert_history (
  id BIGSERIAL PRIMARY KEY,
  alert_id BIGINT REFERENCES quality_alerts(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by TEXT,
  change_reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alert_history_alert_id ON alert_history(alert_id);
CREATE INDEX idx_alert_history_changed_at ON alert_history(changed_at);

-- Enable RLS on all tables
ALTER TABLE water_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Create public read policies for demo/public access
CREATE POLICY "Public read access to water_quality_readings"
  ON water_quality_readings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to monitoring_locations"
  ON monitoring_locations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to quality_predictions"
  ON quality_predictions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to quality_alerts"
  ON quality_alerts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to alert_history"
  ON alert_history FOR SELECT
  TO public
  USING (true);
