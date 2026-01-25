/**
 * Fix locations table and add location_summary view
 */

exports.up = function (knex) {
  return knex.schema
    .alterTable('locations', function (table) {
      table.string('water_body_name');
      table.integer('population_affected');
    })
    .then(function () {
      return knex.raw('DROP VIEW IF EXISTS location_summary');
    })
    .then(function () {
      return knex.raw(`
        CREATE VIEW location_summary AS
        SELECT 
            l.id,
            l.name,
            l.state,
            l.district,
            l.latitude,
            l.longitude,
            l.water_body_type,
            l.water_body_name,
            l.population_affected,
            COUNT(DISTINCT wqr.parameter_id) as parameters_monitored,
            MAX(wqr.measurement_date) as last_reading,
            AVG(wqr.quality_score) as avg_wqi_score,
            COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) as active_alerts
        FROM locations l
        LEFT JOIN water_quality_readings wqr ON l.id = wqr.location_id
        LEFT JOIN alerts a ON l.id = a.location_id
        GROUP BY l.id, l.name, l.state, l.district, l.latitude, l.longitude, l.water_body_type, l.water_body_name, l.population_affected
      `);
    });
};

exports.down = function (knex) {
  return knex.raw('DROP VIEW IF EXISTS location_summary').then(function () {
    return knex.schema.alterTable('locations', function (table) {
      table.dropColumn('water_body_name');
      table.dropColumn('population_affected');
    });
  });
};
