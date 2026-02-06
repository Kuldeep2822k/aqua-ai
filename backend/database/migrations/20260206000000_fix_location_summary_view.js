exports.up = function (knex) {
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
  return knex.raw(`
    CREATE OR REPLACE VIEW location_summary AS
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
    GROUP BY l.id, l.name, l.state, l.district, l.latitude, l.longitude
  `);
};

