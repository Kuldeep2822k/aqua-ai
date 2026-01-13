-- Aqua-AI Database Schema
-- PostgreSQL with PostGIS extension for spatial data

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom types
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'dismissed');
CREATE TYPE data_source_type AS ENUM ('government', 'community', 'sensor', 'satellite');

-- Locations table for water monitoring stations
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    water_body_type VARCHAR(50) DEFAULT 'river',
    water_body_name VARCHAR(255),
    elevation DECIMAL(8, 2),
    population_affected INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Spatial index
    geom GEOMETRY(POINT, 4326),
    
    -- Constraints
    CONSTRAINT valid_coordinates CHECK (
        latitude BETWEEN -90 AND 90 AND 
        longitude BETWEEN -180 AND 180
    )
);

-- Create spatial index
CREATE INDEX idx_locations_geom ON locations USING GIST (geom);

-- Water quality parameters reference table
CREATE TABLE water_quality_parameters (
    id SERIAL PRIMARY KEY,
    parameter_code VARCHAR(20) UNIQUE NOT NULL,
    parameter_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    safe_limit DECIMAL(10, 4),
    moderate_limit DECIMAL(10, 4),
    high_limit DECIMAL(10, 4),
    critical_limit DECIMAL(10, 4),
    description TEXT,
    measurement_method VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water quality readings table
CREATE TABLE water_quality_readings (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    parameter_id INTEGER REFERENCES water_quality_parameters(id) ON DELETE CASCADE,
    value DECIMAL(12, 6) NOT NULL,
    measurement_date TIMESTAMP NOT NULL,
    source data_source_type DEFAULT 'government',
    quality_score DECIMAL(5, 2),
    risk_level risk_level,
    is_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_value CHECK (value >= 0),
    CONSTRAINT valid_quality_score CHECK (quality_score BETWEEN 0 AND 100)
);

-- Create indexes for performance
CREATE INDEX idx_readings_location_date ON water_quality_readings(location_id, measurement_date);
CREATE INDEX idx_readings_parameter ON water_quality_readings(parameter_id);
CREATE INDEX idx_readings_risk_level ON water_quality_readings(risk_level);
CREATE INDEX idx_readings_date ON water_quality_readings(measurement_date);

-- AI predictions table
CREATE TABLE ai_predictions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    parameter_id INTEGER REFERENCES water_quality_parameters(id) ON DELETE CASCADE,
    predicted_value DECIMAL(12, 6) NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    prediction_date TIMESTAMP NOT NULL,
    forecast_hours INTEGER NOT NULL,
    model_version VARCHAR(50),
    risk_level risk_level,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence_score BETWEEN 0 AND 100),
    CONSTRAINT valid_forecast_hours CHECK (forecast_hours > 0)
);

-- Create indexes for AI predictions
CREATE INDEX idx_predictions_location ON ai_predictions(location_id);
CREATE INDEX idx_predictions_date ON ai_predictions(prediction_date);
CREATE INDEX idx_predictions_risk ON ai_predictions(risk_level);

-- Alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    parameter_id INTEGER REFERENCES water_quality_parameters(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity risk_level NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(12, 6),
    actual_value DECIMAL(12, 6),
    status alert_status DEFAULT 'active',
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for alerts
CREATE INDEX idx_alerts_location ON alerts(location_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at);

-- Weather data table for correlation analysis
CREATE TABLE weather_data (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    pressure DECIMAL(8, 2),
    wind_speed DECIMAL(5, 2),
    wind_direction INTEGER,
    precipitation DECIMAL(8, 2),
    weather_condition VARCHAR(100),
    measurement_date TIMESTAMP NOT NULL,
    source VARCHAR(100) DEFAULT 'weather_api',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for weather data
CREATE INDEX idx_weather_location_date ON weather_data(location_id, measurement_date);

-- Community reports table
CREATE TABLE community_reports (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    report_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    photos JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for community reports
CREATE INDEX idx_community_location ON community_reports(location_id);
CREATE INDEX idx_community_status ON community_reports(status);
CREATE INDEX idx_community_created ON community_reports(created_at);

-- Data sources tracking table
CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    source_type data_source_type NOT NULL,
    api_url TEXT,
    api_key_hash VARCHAR(255),
    last_fetch TIMESTAMP,
    fetch_frequency INTERVAL,
    status VARCHAR(20) DEFAULT 'active',
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water quality index (WQI) calculations table
CREATE TABLE water_quality_index (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    wqi_score DECIMAL(5, 2) NOT NULL,
    wqi_category VARCHAR(20) NOT NULL,
    calculation_date TIMESTAMP NOT NULL,
    parameters_used JSONB,
    calculation_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for WQI
CREATE INDEX idx_wqi_location ON water_quality_index(location_id);
CREATE INDEX idx_wqi_date ON water_quality_index(calculation_date);

-- Insert initial water quality parameters
INSERT INTO water_quality_parameters (parameter_code, parameter_name, unit, safe_limit, moderate_limit, high_limit, critical_limit, description) VALUES
('BOD', 'Biochemical Oxygen Demand', 'mg/L', 3.0, 6.0, 10.0, 15.0, 'Measures organic pollution in water'),
('TDS', 'Total Dissolved Solids', 'mg/L', 500, 1000, 1500, 2000, 'General measure of water purity'),
('pH', 'pH Level', '', 6.5, 8.5, 9.0, 10.0, 'Acidity/alkalinity measure'),
('DO', 'Dissolved Oxygen', 'mg/L', 6.0, 4.0, 2.0, 1.0, 'Oxygen available for aquatic life'),
('Lead', 'Lead', 'mg/L', 0.01, 0.05, 0.1, 0.2, 'Heavy metal contamination'),
('Mercury', 'Mercury', 'mg/L', 0.001, 0.005, 0.01, 0.02, 'Toxic heavy metal'),
('Coliform', 'Coliform Count', 'MPN/100ml', 2.2, 10, 50, 100, 'Bacterial contamination indicator'),
('Nitrates', 'Nitrates', 'mg/L', 45, 100, 200, 300, 'Agricultural runoff indicator');

-- Create views for common queries
CREATE VIEW recent_water_quality AS
SELECT 
    l.name as location_name,
    l.state,
    l.district,
    l.latitude,
    l.longitude,
    wqp.parameter_name,
    wqr.value,
    wqp.unit,
    wqr.measurement_date,
    wqr.risk_level,
    wqr.quality_score
FROM water_quality_readings wqr
JOIN locations l ON wqr.location_id = l.id
JOIN water_quality_parameters wqp ON wqr.parameter_id = wqp.id
WHERE wqr.measurement_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY wqr.measurement_date DESC;

CREATE VIEW active_alerts AS
SELECT 
    a.id,
    l.name as location_name,
    l.state,
    wqp.parameter_name,
    a.alert_type,
    a.severity,
    a.message,
    a.triggered_at
FROM alerts a
JOIN locations l ON a.location_id = l.id
JOIN water_quality_parameters wqp ON a.parameter_id = wqp.id
WHERE a.status = 'active'
ORDER BY a.triggered_at DESC;

CREATE VIEW location_summary AS
SELECT 
    l.id,
    l.name,
    l.state,
    l.district,
    l.latitude,
    l.longitude,
    COUNT(DISTINCT wqr.parameter_id) as parameters_monitored,
    MAX(wqr.measurement_date) as last_reading,
    AVG(wqi.wqi_score) as avg_wqi_score,
    COUNT(a.id) as active_alerts
FROM locations l
LEFT JOIN water_quality_readings wqr ON l.id = wqr.location_id
LEFT JOIN water_quality_index wqi ON l.id = wqi.location_id
LEFT JOIN alerts a ON l.id = a.location_id AND a.status = 'active'
GROUP BY l.id, l.name, l.state, l.district, l.latitude, l.longitude;

-- Create function to update location geometry
CREATE OR REPLACE FUNCTION update_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update geometry
CREATE TRIGGER trigger_update_location_geometry
    BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geometry();

-- Create function to calculate risk level
CREATE OR REPLACE FUNCTION calculate_risk_level(
    param_code VARCHAR(20),
    value DECIMAL(12, 6)
) RETURNS risk_level AS $$
DECLARE
    param_record RECORD;
BEGIN
    SELECT * INTO param_record 
    FROM water_quality_parameters 
    WHERE parameter_code = param_code;
    
    IF param_record.parameter_code = 'pH' THEN
        IF value BETWEEN param_record.safe_limit AND param_record.moderate_limit THEN
            RETURN 'low';
        ELSIF value BETWEEN (param_record.safe_limit - 1) AND (param_record.moderate_limit + 1) THEN
            RETURN 'medium';
        ELSE
            RETURN 'high';
        END IF;
    ELSIF param_record.parameter_code = 'DO' THEN
        IF value >= param_record.safe_limit THEN
            RETURN 'low';
        ELSIF value >= param_record.moderate_limit THEN
            RETURN 'medium';
        ELSIF value >= param_record.high_limit THEN
            RETURN 'high';
        ELSE
            RETURN 'critical';
        END IF;
    ELSE
        IF value <= param_record.safe_limit THEN
            RETURN 'low';
        ELSIF value <= param_record.moderate_limit THEN
            RETURN 'medium';
        ELSIF value <= param_record.high_limit THEN
            RETURN 'high';
        ELSE
            RETURN 'critical';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update water quality readings with risk level
CREATE OR REPLACE FUNCTION update_risk_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.risk_level = calculate_risk_level(
        (SELECT parameter_code FROM water_quality_parameters WHERE id = NEW.parameter_id),
        NEW.value
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate risk level
CREATE TRIGGER trigger_update_risk_level
    BEFORE INSERT OR UPDATE ON water_quality_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_risk_level();