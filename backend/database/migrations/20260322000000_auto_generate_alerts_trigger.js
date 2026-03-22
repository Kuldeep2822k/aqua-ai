exports.up = async function (knex) {
  // Add trigger to automatically generate or resolve alerts based on risk_level
  await knex.raw(`
    CREATE OR REPLACE FUNCTION generate_alert_on_high_risk()
    RETURNS TRIGGER AS $$
    DECLARE
        param_record RECORD;
        loc_name VARCHAR;
        alert_msg TEXT;
        threshold DECIMAL;
        existing_alert_id INTEGER;
        existing_alert_severity risk_level;
    BEGIN
        IF NEW.risk_level IN ('medium', 'high', 'critical') THEN
            -- Get parameter details
            SELECT * INTO param_record FROM water_quality_parameters WHERE id = NEW.parameter_id;
            
            -- Get location details
            SELECT name INTO loc_name FROM locations WHERE id = NEW.location_id;
            
            -- Determine threshold based on risk_level
            IF NEW.risk_level = 'critical' THEN
                threshold := param_record.critical_limit;
            ELSIF NEW.risk_level = 'high' THEN
                threshold := param_record.high_limit;
            ELSE
                threshold := param_record.moderate_limit;
            END IF;
            
            alert_msg := param_record.parameter_name || ' at ' || loc_name || ' is at ' || NEW.risk_level || ' level (' || NEW.value || ' ' || param_record.unit || '). Threshold: ' || COALESCE(threshold, 0);
            
            -- Check for existing active alert
            SELECT id, severity INTO existing_alert_id, existing_alert_severity 
            FROM alerts 
            WHERE location_id = NEW.location_id 
              AND parameter_id = NEW.parameter_id 
              AND status = 'active'
            LIMIT 1;
            
            IF existing_alert_id IS NULL THEN
                INSERT INTO alerts (
                    location_id, 
                    parameter_id, 
                    alert_type, 
                    severity, 
                    message, 
                    threshold_value, 
                    actual_value, 
                    status,
                    triggered_at,
                    created_at
                )
                VALUES (
                    NEW.location_id,
                    NEW.parameter_id,
                    'threshold_exceeded',
                    NEW.risk_level,
                    alert_msg,
                    threshold,
                    NEW.value,
                    'active',
                    NEW.measurement_date,
                    CURRENT_TIMESTAMP
                );
            ELSIF existing_alert_severity != NEW.risk_level THEN
                UPDATE alerts 
                SET severity = NEW.risk_level,
                    actual_value = NEW.value,
                    message = param_record.parameter_name || ' at ' || loc_name || ' escalated to ' || NEW.risk_level || ' level (' || NEW.value || '). Threshold: ' || COALESCE(threshold, 0)
                WHERE id = existing_alert_id;
            END IF;
        ELSE
            -- If risk is low, resolve existing active alerts for this location and parameter
            UPDATE alerts
            SET status = 'resolved',
                resolved_at = CURRENT_TIMESTAMP,
                actual_value = NEW.value
            WHERE location_id = NEW.location_id 
              AND parameter_id = NEW.parameter_id 
              AND status = 'active';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS trigger_generate_alert_on_reading ON water_quality_readings;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_generate_alert_on_reading
        AFTER INSERT OR UPDATE ON water_quality_readings
        FOR EACH ROW
        EXECUTE FUNCTION generate_alert_on_high_risk();
  `);
};

exports.down = async function (knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trigger_generate_alert_on_reading ON water_quality_readings;');
  await knex.raw('DROP FUNCTION IF EXISTS generate_alert_on_high_risk();');
};
