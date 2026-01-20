/**
 * Initial database schema migration
 * Creates tables for water quality monitoring system
 */

exports.up = function (knex) {
  return (
    knex.schema
      // Create locations table
      .createTable('locations', function (table) {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('state').notNullable();
        table.string('district');
        table.decimal('latitude', 10, 7);
        table.decimal('longitude', 10, 7);
        table.string('water_body_type');
        table.timestamps(true, true);
        table.unique(['name', 'state']);
      })

      // Create water_quality_readings table
      .createTable('water_quality_readings', function (table) {
        table.increments('id').primary();
        table.string('location_name').notNullable();
        table.string('state').notNullable();
        table.string('district');
        table.decimal('latitude', 10, 7);
        table.decimal('longitude', 10, 7);
        table.string('parameter').notNullable();
        table.decimal('value', 10, 3).notNullable();
        table.string('unit');
        table.date('measurement_date').notNullable();
        table.string('source').notNullable();
        table.timestamps(true, true);
        table.index(['location_name', 'state']);
        table.index('measurement_date');
        table.index('parameter');
      })

      // Create data_sources table
      .createTable('data_sources', function (table) {
        table.increments('id').primary();
        table.string('name').unique().notNullable();
        table.string('api_url');
        table.timestamp('last_fetch');
        table.string('status').defaultTo('active');
        table.timestamps(true, true);
      })

      // Create alerts table
      .createTable('alerts', function (table) {
        table.increments('id').primary();
        table.string('location_name').notNullable();
        table.string('state').notNullable();
        table.string('parameter').notNullable();
        table.decimal('value', 10, 3).notNullable();
        table.decimal('threshold', 10, 3).notNullable();
        table.string('severity').notNullable(); // safe, medium, high, critical
        table.text('message');
        table.boolean('is_resolved').defaultTo(false);
        table.timestamp('triggered_at').defaultTo(knex.fn.now());
        table.timestamp('resolved_at');
        table.timestamps(true, true);
        table.index('triggered_at');
        table.index('is_resolved');
      })

      // Create predictions table
      .createTable('predictions', function (table) {
        table.increments('id').primary();
        table.string('location_name').notNullable();
        table.string('state').notNullable();
        table.string('parameter').notNullable();
        table.decimal('predicted_value', 10, 3).notNullable();
        table.date('prediction_date').notNullable();
        table.decimal('confidence_score', 3, 2);
        table.string('model_version');
        table.timestamps(true, true);
        table.index(['location_name', 'prediction_date']);
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('predictions')
    .dropTableIfExists('alerts')
    .dropTableIfExists('data_sources')
    .dropTableIfExists('water_quality_readings')
    .dropTableIfExists('locations');
};
