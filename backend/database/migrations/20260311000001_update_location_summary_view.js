/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    CREATE OR REPLACE VIEW location_summary AS
    SELECT 
        l.id,
        l.name,
        l.state,
        l.district,
        l.latitude,
        l.longitude,
        l.station_code,
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

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
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
