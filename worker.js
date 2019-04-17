var Queue = require('bull');

// 設定をロード
var config = require('./settings');

// 各キューを生成
var follow = new Queue('follow', config);
var unfollow = new Queue('unfollow', config);
var forward = new Queue('forward', config);
var remoteFollow = new Queue('remoteFollow', config);

// プロセス設定
follow.process(require('./queues/follow_queue'));
unfollow.process(require('./queues/unfollow_queue'));
forward.process(config.queue.pool, require('./queues/forward_queue'));
remoteFollow.process(config.queue.pool, require('./queues/remote_follow_queue'));
  
//
module.exports = {
  // フォローキュー
  followQueue: follow,
  // アンフォローキュー
  unfollowQueue: unfollow,
  // フォーワードキュー
  forwardQueue: forward,

  // リモートフォローキュー
  remoteFollowQueue: remoteFollow
};