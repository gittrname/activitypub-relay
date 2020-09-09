
exports.up = function(knex) {
  return knex.schema.table('relays', function(t) {
      t.integer('status').notNull().defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.table('relays', function(t) {
      t.dropColumn('status');
  });
};
