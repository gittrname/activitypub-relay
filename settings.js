var Url = require('url');

var relayUrl = Url.parse((process.env.RELAY_URL) ? process.env.RELAY_URL : "https://127.0.0.1:3000");

module.exports = {

  // relay server setting
  relay: {
    url: relayUrl.href.substring(0, relayUrl.href.length-1),
    actor: relayUrl.href+'actor',
    keyId: relayUrl.href+'actor#main-key',
    account: 'acct:relay@'+relayUrl.host,
    privateKey: (process.env.PRIVATE_KEY) ? process.env.PRIVATE_KEY : "not private key.",
    publicKey: (process.env.PUBLIC_KEY) ? process.env.PUBLIC_KEY : "not public key."
  },

  // redis
  redis: {
    host: (process.env.REDIS_HOST) ? process.env.REDIS_HOST : "127.0.0.1",
    port: (process.env.REDIS_PORT) ? Number(process.env.REDIS_PORT) : 6379,
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

  // influx
  influx: {
    host:     (process.env.INFLUX_HOST) ? process.env.INFLUX_HOST : "127.0.0.1",
    port:     (process.env.INFLUX_PORT) ? process.env.INFLUX_PORT : "8086",
    database: (process.env.INFLUX_DATABASE) ? process.env.INFLUX_DATABASE : "influx",
    username: (process.env.INFLUX_USERNAME) ? process.env.INFLUX_USERNAME : "",
    password: (process.env.INFLUX_PASSWORD) ? process.env.INFLUX_PASSWORD : "",
  },

  // process queue
  queue: {
    pool: (process.env.QUEUE_POOL) ? Number(process.env.QUEUE_POOL): 5
  },

  // request cache
  cache: {
    size:  (process.env.CACHE_SIZE) ? Number(process.env.CACHE_SIZE): 1024,
    limit: 10 * 60 * 1000 // 10m
  },


  // admin page
  admin: {
    username: (process.env.ADMIN_USER) ? process.env.ADMIN_USER: 'admin',
    password: (process.env.ADMIN_PASS) ? process.env.ADMIN_PASS: 'relay'
  }
};