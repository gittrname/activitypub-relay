var Knex = require('knex');

// 設定をロード
var config = require('./config/settings');

// DBインスタンス生成
module.exports = Knex(config.database);