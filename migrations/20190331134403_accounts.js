'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.hasTable('accounts').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('accounts', function(table) {
          table.increments('id').primary();
          table.string('username');
          table.string('domain', 1024);
          table.text('private_key');
          table.text('public_key');

          table.string('display_name');
          table.text('note');
          table.text('uri');
          table.text('url');
          table.text('avatar_remote_url');
          table.text('header_remote_url');

          table.text('inbox_url');
          table.text('outbox_url');
          table.text('shared_inbox_url');
          table.text('shared_outbox_url');
          table.text('followers_url');
          table.text('following_url');

          table.string('actor_type');
          table.boolean('discoverable');

          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
      }else{
        return new Error("Table:accounts is already exists");
      }
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.hasTable('accounts').then(function(exists) {
      if (exists) {
        return knex.schema.dropTable('accounts');
      }
    });
};
