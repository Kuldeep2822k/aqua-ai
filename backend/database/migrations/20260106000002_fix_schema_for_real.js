/**
 * Fix schema to match code expectations
 * Adds water_quality_parameters table and fixes foreign keys
 */

exports.up = async function (knex) {
  // Drop dependent tables first
  await knex.schema.dropTableIfExists('predictions');
  await knex.schema.dropTableIfExists('alerts');
  await knex.schema.dropTableIfExists('water_quality_readings');
  await knex.schema.dropTableIfExists('water_quality_parameters');

  // 1. Create water_quality_parameters table
  await knex.schema.createTable('water_quality_parameters', function (table) {
    table.increments('id').primary();
    table.string('parameter_code').unique().notNullable();
    table.string('parameter_name').notNullable();
    table.string('unit').notNullable();
    table.decimal('safe_limit', 12, 4);
    table.decimal('moderate_limit', 12, 4);
    table.decimal('high_limit', 12, 4);
    table.decimal('critical_limit', 12, 4);
    table.text('description');
    table.timestamps(true, true);
  });

  // 2. Recreate water_quality_readings table with foreign keys
  await knex.schema.createTable('water_quality_readings', function (table) {
    table.increments('id').primary();
    table
      .integer('location_id')
      .unsigned()
      .references('id')
      .inTable('locations')
      .onDelete('CASCADE');
    table
      .integer('parameter_id')
      .unsigned()
      .references('id')
      .inTable('water_quality_parameters')
      .onDelete('CASCADE');
    table.decimal('value', 12, 6).notNullable();
    table.timestamp('measurement_date').notNullable();
    table.string('risk_level');
    table.decimal('quality_score', 5, 2);
    table.string('source').defaultTo('government');
    table.boolean('is_validated').defaultTo(false);
    table.text('validation_notes');
    table.timestamps(true, true);

    table.index(['location_id', 'measurement_date']);
    table.index('parameter_id');
  });

  // 3. Recreate alerts table with foreign keys
  await knex.schema.createTable('alerts', function (table) {
    table.increments('id').primary();
    table
      .integer('location_id')
      .unsigned()
      .references('id')
      .inTable('locations')
      .onDelete('CASCADE');
    table
      .integer('parameter_id')
      .unsigned()
      .references('id')
      .inTable('water_quality_parameters')
      .onDelete('CASCADE');
    table.string('alert_type').notNullable();
    table.string('severity').notNullable();
    table.text('message').notNullable();
    table.decimal('threshold_value', 12, 6);
    table.decimal('actual_value', 12, 6);
    table.string('status').defaultTo('active');
    table.timestamp('triggered_at').defaultTo(knex.fn.now());
    table.timestamp('resolved_at');
    table.text('resolution_notes');
    table.text('dismissal_reason');
    table.boolean('notification_sent').defaultTo(false);
    table.timestamps(true, true);

    table.index('status');
    table.index('severity');
  });

  // 4. Recreate predictions table
  await knex.schema.createTable('predictions', function (table) {
    table.increments('id').primary();
    table
      .integer('location_id')
      .unsigned()
      .references('id')
      .inTable('locations')
      .onDelete('CASCADE');
    table
      .integer('parameter_id')
      .unsigned()
      .references('id')
      .inTable('water_quality_parameters')
      .onDelete('CASCADE');
    table.decimal('predicted_value', 12, 6).notNullable();
    table.decimal('confidence_score', 5, 2);
    table.timestamp('prediction_date').notNullable();
    table.string('model_version');
    table.string('risk_level');
    table.timestamps(true, true);
  });

  // 5. Create active_alerts view
  await knex.raw(`
    CREATE VIEW active_alerts AS
    SELECT 
        a.id,
        l.name as location_name,
        l.state,
        wqp.parameter_name,
        a.alert_type,
        a.severity,
        a.message,
        a.triggered_at,
        a.status -- Added for safety
    FROM alerts a
    JOIN locations l ON a.location_id = l.id
    JOIN water_quality_parameters wqp ON a.parameter_id = wqp.id
    WHERE a.status = 'active'
  `);

  // 6. Seed initial parameters (from schema.sql)
  await knex('water_quality_parameters').insert([
    {
      parameter_code: 'BOD',
      parameter_name: 'Biochemical Oxygen Demand',
      unit: 'mg/L',
      safe_limit: 3.0,
      moderate_limit: 6.0,
      high_limit: 10.0,
      critical_limit: 15.0,
      description: 'Measures organic pollution in water',
    },
    {
      parameter_code: 'TDS',
      parameter_name: 'Total Dissolved Solids',
      unit: 'mg/L',
      safe_limit: 500,
      moderate_limit: 1000,
      high_limit: 1500,
      critical_limit: 2000,
      description: 'General measure of water purity',
    },
    {
      parameter_code: 'pH',
      parameter_name: 'pH Level',
      unit: '',
      safe_limit: 6.5,
      moderate_limit: 8.5,
      high_limit: 9.0,
      critical_limit: 10.0,
      description: 'Acidity/alkalinity measure',
    },
    {
      parameter_code: 'DO',
      parameter_name: 'Dissolved Oxygen',
      unit: 'mg/L',
      safe_limit: 6.0,
      moderate_limit: 4.0,
      high_limit: 2.0,
      critical_limit: 1.0,
      description: 'Oxygen available for aquatic life',
    },
    {
      parameter_code: 'Lead',
      parameter_name: 'Lead',
      unit: 'mg/L',
      safe_limit: 0.01,
      moderate_limit: 0.05,
      high_limit: 0.1,
      critical_limit: 0.2,
      description: 'Heavy metal contamination',
    },
    {
      parameter_code: 'Mercury',
      parameter_name: 'Mercury',
      unit: 'mg/L',
      safe_limit: 0.001,
      moderate_limit: 0.005,
      high_limit: 0.01,
      critical_limit: 0.02,
      description: 'Toxic heavy metal',
    },
    {
      parameter_code: 'Coliform',
      parameter_name: 'Coliform Count',
      unit: 'MPN/100ml',
      safe_limit: 2.2,
      moderate_limit: 10,
      high_limit: 50,
      critical_limit: 100,
      description: 'Bacterial contamination indicator',
    },
    {
      parameter_code: 'Nitrates',
      parameter_name: 'Nitrates',
      unit: 'mg/L',
      safe_limit: 45,
      moderate_limit: 100,
      high_limit: 200,
      critical_limit: 300,
      description: 'Agricultural runoff indicator',
    },
  ]);
};

exports.down = async function (knex) {
  await knex.raw('DROP VIEW IF EXISTS active_alerts');
  await knex.schema.dropTableIfExists('predictions');
  await knex.schema.dropTableIfExists('alerts');
  await knex.schema.dropTableIfExists('water_quality_readings');
  await knex.schema.dropTableIfExists('water_quality_parameters');
};
