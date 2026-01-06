/**
 * Migration: Create users table for authentication
 */

exports.up = function (knex) {
    return knex.schema.createTable('users', function (table) {
        table.increments('id').primary();
        table.string('email', 255).notNullable().unique();
        table.string('password', 255).notNullable();
        table.string('name', 255);
        table.enum('role', ['user', 'admin', 'moderator']).defaultTo('user');
        table.boolean('email_verified').defaultTo(false);
        table.timestamp('last_login');
        table.timestamps(true, true);

        // Indexes
        table.index('email');
        table.index('role');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
