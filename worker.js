var Queue = require('bull');

// 設定をロード
var config = require('./settings');

var redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined
};

var queueOptions = {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: true
  }
};

if (process.env.NODE_ENV === 'test') {
  module.exports = {
    followQueue: {
      add: function() {
        return Promise.resolve();
      }
    },
    unfollowQueue: {
      add: function() {
        return Promise.resolve();
      }
    },
    forwardQueue: {
      add: function() {
        return Promise.resolve();
      }
    }
  };
} else {
  // 各キューを生成
  var follow = new Queue('follow', queueOptions);
  var unfollow = new Queue('unfollow', queueOptions);
  var forward = new Queue('forward', queueOptions);

  // プロセス設定
  follow.process(require('./queues/follow_queue'));
  unfollow.process(require('./queues/unfollow_queue'));
  forward.process(config.queue.pool, require('./queues/forward_queue'));

  module.exports = {
    followQueue: follow,
    unfollowQueue: unfollow,
    forwardQueue: forward
  };
}