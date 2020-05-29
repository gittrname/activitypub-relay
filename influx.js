const Influx = require('influx');

// 設定をロード
const config = require('./settings');

// 初期化処理
const influx = new Influx.InfluxDB({
  host: config.influx.host,
  port: config.influx.port,
  database: config.influx.database,
  username: config.influx.username,
  password: config.influx.password,
  schema: [
    {
      measurement: 'forward',
      fields: {
        id: Influx.FieldType.STRING,
        result: Influx.FieldType.BOOLEAN
      },
      tags: [
        'inbox_url'
      ]
    },
    {
      measurement: 'boost',
      fields: {
        id: Influx.FieldType.STRING,
        result: Influx.FieldType.BOOLEAN
      },
      tags: [
        'inbox_url'
      ]
    },
    {
      measurement: 'hashtag',
      fields: {
        id: Influx.FieldType.STRING,
      },
      tags: [
        'type',
        'name'
      ]
    }
  ]
});
influx.getDatabaseNames()
  .then(function(names) {
    if (!names.includes(config.influx.database)) {
      influx.createDatabase(config.influx.database);
      influx.createRetentionPolicy('90d', {
        database: config.influx.database,
        duration: '90d',
        replication: 1,
        isDefault: true
      });
      return;
    }
  })
  .catch(function(err) {
    console.log('influx create faild.['+err+']');
    process.exit(-1);
  });

module.exports = influx;