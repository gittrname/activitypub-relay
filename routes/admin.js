var express = require('express');
var router = express.Router();

// 設定ロード
var config = require('../settings');

// キューイング管理
const Arena = require('bull-arena');


//
// Topページ
router.get("/", function(req, res, next) {
  res.render("admin/dashboard");
});

//
// Queueページ
router.use("/queues", Arena({
  queues: [
    {
      name: "followQueue",
      hostId: "redis",
      redis: config.redis
    },
    {
      name: "unfollowQueue",
      hostId: "redis",
      redis: config.redis
    },
    {
      name: "forwardQueue",
      hostId: "redis",
      redis: config.redis
    },
    {
      name: "remoteFollowQueue",
      hostId: "redis",
      redis: config.redis
    }
  ]
}));

module.exports = router;