var Queue = require('bull');

// 設定をロード
var config = require('./config/settings');

// 各キューを生成
var follow = new Queue('follow', config.redis);
var unfollow = new Queue('unfollow', config.redis);
var forward = new Queue('forward', config.redis);

// プロセス設定
follow.process(require('./queues/follow_queue'));
unfollow.process(require('./queues/unfollow_queue'));
forward.process(config.queue.pool, require('./queues/forward_queue'));
  
//
module.exports = {
  // フォローキュー
  followQueue: follow,
  // アンフォローキュー
  unfollowQueue: unfollow,
  // フォーワードキュー
  forwardQueue: forward
};