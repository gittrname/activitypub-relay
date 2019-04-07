var Knex = require('knex');

var config = require('./config/settings');

module.exports = Knex(config.database);