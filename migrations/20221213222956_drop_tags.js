
exports.up = function(knex) {
  
    return knex.schema.hasTable('tags').then(function(exists) {
      if (!exists) {
        return knex.schema.dropTable('tags');
      }else{
        return new Error("Table:tags is already drops");
      }
    });
  
};

exports.down = function(knex) {
  
    return knex.schema.hasTable('tags').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('tags', function(table) {
          table.increments('id').primary();
          table.string('type', 128);
          table.string('href', 2048);
          table.string('name', 256);
  
          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
      }else{
        return new Error("Table:tags is already exists");
      }
    });
};
