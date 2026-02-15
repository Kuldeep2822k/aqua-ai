exports.up = function (knex) {
  const client = knex.client.config.client;
  if (client === 'sqlite3' || client === 'better-sqlite3') {
    return knex.raw(`
      CREATE VIEW IF NOT EXISTS location_summary AS
      SELECT 
          l.id,
          l.name,
          l.state,
          l.district,
          l.latitude,
          l.longitude,
          l.water_body_type,
          l.created_at,
          l.updated_at,
          (
            SELECT COUNT(DISTINCT wr.parameter) 
            FROM water_quality_readings wr 
            WHERE wr.location_name = l.name AND wr.state = l.state
          ) as parameters_monitored,
          (
            SELECT MAX(wr.measurement_date) 
            FROM water_quality_readings wr 
            WHERE wr.location_name = l.name AND wr.state = l.state
          ) as last_reading,
          (
            SELECT AVG(
              CASE 
                WHEN wr.parameter = 'pH' THEN 
                  CASE WHEN wr.value BETWEEN 6.5 AND 8.5 THEN 100 ELSE 50 END
                WHEN wr.parameter = 'DO' THEN 
                  CASE WHEN wr.value >= 6 THEN 100 WHEN wr.value >= 4 THEN 70 ELSE 30 END
                WHEN wr.parameter = 'BOD' THEN 
                  CASE WHEN wr.value <= 3 THEN 100 WHEN wr.value <= 6 THEN 70 ELSE 30 END
                WHEN wr.parameter = 'TDS' THEN 
                  CASE WHEN wr.value <= 500 THEN 100 WHEN wr.value <= 1000 THEN 70 ELSE 30 END
                ELSE 70
              END
            ) 
            FROM water_quality_readings wr 
            WHERE wr.location_name = l.name AND wr.state = l.state
          ) as avg_wqi_score,
          (
            SELECT COUNT(*) 
            FROM alerts a 
            WHERE a.location_name = l.name AND a.state = l.state AND a.is_resolved = 0
          ) as active_alerts
      FROM locations l
    `);
  }

  return knex.raw(`
    CREATE OR REPLACE VIEW location_summary AS
    SELECT 
        l.id,
        l.name,
        l.state,
        l.district,
        l.latitude,
        l.longitude,
        (
          SELECT COUNT(DISTINCT wqr.parameter_id)
          FROM water_quality_readings wqr
          WHERE wqr.location_id = l.id
        ) as parameters_monitored,
        (
          SELECT MAX(wqr.measurement_date)
          FROM water_quality_readings wqr
          WHERE wqr.location_id = l.id
        ) as last_reading,
        (
          SELECT AVG(wqi.wqi_score)
          FROM water_quality_index wqi
          WHERE wqi.location_id = l.id
        ) as avg_wqi_score,
        (
          SELECT COUNT(*)
          FROM alerts a
          WHERE a.location_id = l.id AND a.status = 'active'
        ) as active_alerts
    FROM locations l
  `);
};

exports.down = function (knex) {
  return knex.raw('DROP VIEW IF EXISTS location_summary');
};
