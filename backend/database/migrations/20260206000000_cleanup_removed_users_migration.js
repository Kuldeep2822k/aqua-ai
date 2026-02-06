exports.up = async function (knex) {
  await knex('knex_migrations')
    .where({ name: '20260106000001_add_users_table.js' })
    .del();
};

exports.down = async function () {};
