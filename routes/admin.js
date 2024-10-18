var express = require('express');
const { ExpressAdapter, createBullBoard, BullAdapter } = require('@bull-board/express');

var router = express.Router();

// bull-dashborad
const serverAdapter = new ExpressAdapter();
var worker = require('../worker');
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullAdapter(worker.followQueue),
    new BullAdapter(worker.unfollowQueue),
    new BullAdapter(worker.forwardQueue)
  ],
  serverAdapter: serverAdapter,
});
serverAdapter.setBasePath('/admin/queues');

// 認証機構
var passport = require('passport');
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log('logined')
    return next();
  } else {
    console.log('no login')
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
  req.session.destroy(function() {
    res.redirect("/admin/login");
  })
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

// Queueページ
router.use("/queues", isAuthenticated, serverAdapter.getRouter());

module.exports = router;