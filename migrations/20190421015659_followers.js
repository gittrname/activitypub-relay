
exports.up = function(knex, Promise) {
  
  return knex.schema.hasTable('followers').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('followers', function(table) {
        table.increments('id').primary();
        table.integer('account_id');
        table.string('domain', 1024);

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    }else{
      return new Error("Table:followers is already exists");
    }
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.hasTable('followers').then(function(exists) {
    if (exists) {
      return knex.schema.dropTable('followers');
    }
  });
};
