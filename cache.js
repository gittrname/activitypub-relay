var { LRUCache } = require('lru-cache');

var config = require('./settings');

module.exports = new LRUCache({
  max: config.cache.size,
  ttl: config.cache.limit
});
