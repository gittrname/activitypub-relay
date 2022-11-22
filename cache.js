var LruCache = require('lru-cache');

var config = require('./settings');

module.exports = new LruCache({
  max: config.cache.size,
  ttl: config.cache.limit
});
