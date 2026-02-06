const fs = require('fs');
const path = require('path');

exports.up = async function (knex) {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await knex.raw(sql);

  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    await knex.schema.createTable('users', function (table) {
      table.increments('id').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password', 255).notNullable();
      table.string('name', 255);
      table.enum('role', ['user', 'admin', 'moderator']).defaultTo('user');
      table.boolean('email_verified').defaultTo(false);
      table.timestamp('last_login');
      table.timestamps(true, true);
      table.index('email');
      table.index('role');
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');

  await knex.raw('DROP VIEW IF EXISTS location_summary CASCADE');
  await knex.raw('DROP VIEW IF EXISTS active_alerts CASCADE');
  await knex.raw('DROP VIEW IF EXISTS recent_water_quality CASCADE');

  await knex.raw('DROP TRIGGER IF EXISTS trigger_update_location_geometry ON locations');
  await knex.raw('DROP FUNCTION IF EXISTS update_location_geometry');

  await knex.raw('DROP TABLE IF EXISTS water_quality_index CASCADE');
  await knex.raw('DROP TABLE IF EXISTS data_sources CASCADE');
  await knex.raw('DROP TABLE IF EXISTS community_reports CASCADE');
  await knex.raw('DROP TABLE IF EXISTS weather_data CASCADE');
  await knex.raw('DROP TABLE IF EXISTS alerts CASCADE');
  await knex.raw('DROP TABLE IF EXISTS ai_predictions CASCADE');
  await knex.raw('DROP TABLE IF EXISTS water_quality_readings CASCADE');
  await knex.raw('DROP TABLE IF EXISTS water_quality_parameters CASCADE');
  await knex.raw('DROP TABLE IF EXISTS locations CASCADE');

  await knex.raw('DROP TYPE IF EXISTS data_source_type');
  await knex.raw('DROP TYPE IF EXISTS alert_status');
  await knex.raw('DROP TYPE IF EXISTS risk_level');
};
