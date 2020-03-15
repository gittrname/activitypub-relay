var express = require('express');
var database = require('../database');

var router = express.Router();

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
router.use("/instances", isAuthenticated, function(req, res, next) {
  res.render("admin/instance");
});

//
// Accountページ
router.use("/accounts", isAuthenticated, function(req, res, next) {
  res.render("admin/account");
});

//
// Tagページ
router.use("/tags", isAuthenticated, function(req, res, next) {
  res.render("admin/tag");
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