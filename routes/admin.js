var express = require('express');
var database = require('../database');

var router = express.Router();

require('knex-paginator')(database);
require('date-utils');

// 設定ロード
var config = require('../settings');

// キューイング管理
const Arena = require('bull-arena');

// 認証機構
var passport = require('passport');
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/admin/login");
  }
}

//
// ログイン
router.get("/login", function(req, res, next) {
  res.render("admin/login");
});
router.post("/login", passport.authenticate("local",{
  successRedirect: "/admin",
  failureRedirect: "/admin/login",
  failureFlash: true
}));
//
// ログアウト
router.get("/logout", function(req, res, next) {
  req.logout();
  res.redirect("/admin/login")
});

//
// Topページ
router.get("/", isAuthenticated, function(req, res, next) {
    res.render("admin/dashboard");
});

//
// Instanceページ
router.use("/instances/:page?", isAuthenticated, function(req, res, next) {

  var page = req.param('page', 1);
  var keyword = req.param('k', "");

  database('relays')
    .where('domain', 'like', "%" + keyword + "%")
    .paginate(20, page, true)
    .then(function(result) {
      res.render("admin/instance", {'keyword': keyword, 'result': result});
    })
    .catch(function(err) {
      next(err);
    });
});

//
// Accountページ
router.use("/accounts/:page?", isAuthenticated, function(req, res, next) {

  var page = req.param('page', 1);
  var keyword = req.param('k', "");

  database('accounts')
    .where('username', 'like', "%" + keyword + "%")
    .orWhere('domain', 'like', "%" + keyword + "%")
    .paginate(20, page, true)
    .then(function(result) {
      res.render("admin/account", {'keyword': keyword, 'result': result});
    })
    .catch(function(err) {
      next(err);
    });
});

//
// Tagページ
router.use("/tags/:page?", isAuthenticated, function(req, res, next) {

  var page = req.param('page', 1);
  var keyword = req.param('k', "");

  database('tags')
    .select('name')
    .count({count: 'name'})
    .max({last_use: 'updated_at'})
    .where('name', 'like', "%" + keyword + "%")
    .groupBy('name')
    .paginate(20, page, true)
    .then(function(result) {
      res.render("admin/tag", {'keyword': keyword, 'result': result});
    })
    .catch(function(err) {
      next(err);
    });
});

//
// Queueページ
router.use("/queues", isAuthenticated, Arena({
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