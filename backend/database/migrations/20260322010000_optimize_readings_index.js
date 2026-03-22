/**
 * Optimize Water Quality Readings Indexes
 * Adds a composite index to speed up common queries like "latest reading per location/parameter"
 * which is used in the alert generation process and dashboard stats.
 */

exports.up = function(knex) {
  return knex.schema.alterTable('water_quality_readings', (table) => {
    // Composite index for (location, parameter, date) - critical for "latest reading" subqueries
    table.index(['location_id', 'parameter_id', 'measurement_date'], 'idx_readings_loc_param_date');
    
    // Explicit index for quality_score used in stats aggregations
    table.index('quality_score', 'idx_readings_quality_score');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('water_quality_readings', (table) => {
    table.dropIndex(['location_id', 'parameter_id', 'measurement_date'], 'idx_readings_loc_param_date');
    table.dropIndex('quality_score', 'idx_readings_quality_score');
  });
};
