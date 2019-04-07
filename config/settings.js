var uuid = require('node-uuid');

module.exports = {

  relay: {
    url: (process.env.RELAY_URL) ? process.env.RELAY_URL : "https://127.0.0.1:3000",
    keyId: (process.env.RELAY_URL) ? process.env.RELAY_URL+'/'+uuid.v4() : "https://127.0.0.1:3000/"+uuid.v4(),
    account: 'relay'
  },

  redis: {
    host: (process.env.REDIS_HOST) ? process.env.REDIS_HOST : "127.0.0.1",
    post: (process.env.REDIS_PORT) ? process.env.REDIS_PORT : 6379
  },

  database: {
    client: 'postgres',
    connection: {
      host:     (process.env.DB_HOST) ? process.env.DB_HOST : "127.0.0.1",
      port:     (process.env.DB_PORT) ? process.env.DB_PORT : 5432,
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
  }
};