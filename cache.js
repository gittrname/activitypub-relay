var LruCache = require('lru-cache');

var config = require('./config/settings');

module.exports = new LruCache({
  max: config.cache.size,
  maxAge: config.cache.limit
});
