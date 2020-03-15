const Knex = require('knex');

// 設定をロード
const config = require('./settings');

// インスタンス初期化
const database = Knex(config.database);

module.exports = database;