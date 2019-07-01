var express = require('express');
var database = require('../database');

var router = express.Router();

require('knex-paginator')(database);

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
// Instanceページ
router.use("/instances/:page?", function(req, res, next) {

  var page = req.param('page', 1);

  database('relays')
    .paginate(20, page, true)
    .then(function(result) {
      res.render("admin/instance", {'result': result});
    })
    .catch(function(err) {
      next(err);
    });
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