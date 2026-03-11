/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('locations', function(table) {
      table.string('station_code', 50).unique().nullable();
      table.index(['station_code']);
    })
    .alterTable('water_quality_readings', function(table) {
      table.string('external_id', 255).unique().nullable();
      table.jsonb('raw_data').nullable();
      table.index(['external_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('locations', function(table) {
      table.dropColumn('station_code');
    })
    .alterTable('water_quality_readings', function(table) {
      table.dropColumn('external_id');
      table.dropColumn('raw_data');
    });
};
