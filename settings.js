var Url = require('url');

var relayUrl = Url.parse((process.env.RELAY_URL) ? process.env.RELAY_URL : "https://127.0.0.1:3000");

module.exports = {

  // relay server setting
  relay: {
    url: relayUrl.href,
    actor: relayUrl.protocol+'//'+relayUrl.host+'/actor',
    keyId: relayUrl.protocol+'//'+relayUrl.host+'/actor#main-key',
    account: 'acct:relay@'+relayUrl.host,
  },

  // redis
  redis: {
    host: (process.env.REDIS_HOST) ? process.env.REDIS_HOST : "127.0.0.1",
    post: (process.env.REDIS_PORT) ? Number(process.env.REDIS_PORT) : 6379,
    password: ''
  },

  // database
  database: {
    client: 'pg',
    connection: {
      host:     (process.env.DB_HOST) ? process.env.DB_HOST : "127.0.0.1",
      port:     (process.env.DB_PORT) ? Number(process.env.DB_PORT) : 5432,
      database: (process.env.DB_NAME) ? process.env.DB_NAME : "postgres",
      user:     (process.env.DB_USER) ? process.env.DB_USER : "postgres",
      password: (process.env.DB_PASS) ? process.env.DB_PASS : "postgres"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory:'./migrations',
      tableName: 'knex_migrations'
    }
  },

  // process queue
  queue: {
    pool: (process.env.QUEUE_POOL) ? Number(process.env.QUEUE_POOL): 5
  },

  // request cache
  cache: {
    size:  (process.env.CACHE_SIZE) ? Number(process.env.CACHE_SIZE): 100,
    limit: 60 * 60 * 1000 // 1H
  }
};