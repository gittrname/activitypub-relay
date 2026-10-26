const Knex = require('knex');

// 設定をロード
const config = require('./settings');

if (process.env.NODE_ENV === 'test') {
  const createTestQueryBuilder = function() {
    return {
      select: function() {
        return {
          where: function() {
            return Promise.resolve([]);
          }
        };
      },
      insert: function(value) {
        return {
          returning: function() {
            return Promise.resolve(value ? [value] : []);
          }
        };
      }
    };
  };

  module.exports = function() {
    return createTestQueryBuilder();
  };
} else {
  // インスタンス初期化
  const database = Knex(config.database);
  module.exports = database;
}