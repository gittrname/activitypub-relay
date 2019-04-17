var Knex = require('knex');

// 設定をロード
var config = require('./settings');

// DBインスタンス生成
module.exports = Knex(config.database);