// Update with your config settings.
var config = require('./settings');

module.exports = {
  development: config.database,
  staging: config.database,
  production: config.database

};
