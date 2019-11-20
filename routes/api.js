var express = require('express');
var validator = require('validator');
var database = require('../database');
var router = express.Router();

//
var Worker = require('../worker');

//
// フォロー申請受付
router.post('/follow', function (req, res, next) {

  //
  if (validator.isEmpty(req.body.account)) {
    var err = new Error('アカウントを入力してください。');
    err.status = 400;
    return next(err);
  }
  if (!validator.isEmail(req.body.account)) {
    var err = new Error('アカウントを正しい形式で入力してください。');
    err.status = 400;
    return next(err);
  }

  //
  Worker.remoteFollowQueue.add({
    client: {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.rawBody
    }
  });

  //
  res.send('申請を受け付けました。').end();
});

//
// アンフォロー申請受付
router.delete('/follow', function (req, res, next) {

  //
  if (validator.isEmpty(req.body.account)) {
    var err = new Error('アカウントを入力してください。');
    err.status = 400;
    return next(err);
  }
  if (!validator.isEmail(req.body.account)) {
    var err = new Error('アカウントを正しい形式で入力してください。');
    err.status = 400;
    return next(err);
  }

  //
  Worker.remoteUnFollowQueue.add({
    client: {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.rawBody
    }
  });

  //
  res.send('申請を受け付けました。').end();
});


require('knex-paginator')(database);
require('date-utils');

// 認証機構
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401);
  }
}

//
// インスタンス一覧取得
router.use("/instances", isAuthenticated, function(req, res, next) {

  var start = req.param('start', 0);
  var length = req.param('length', 10);

  var search = req.param('search', {value:"", regex:""});

  database('relays')
    .where('domain', 'like', search.value + "%")
    .paginate(length, start, true)
    .then(function(result) {
      res.json({
        "draw": result.per_page,
        "recordsTotal": result.total,
        "recordsFiltered": result.per_page,
        "data": result.data
      });
    })
    .catch(function(err) {
      next(err);
    });
});

//
// アカウント一覧取得
router.use("/accounts", isAuthenticated, function(req, res, next) {

  var start = req.param('start', 0);
  var length = req.param('length', 10);

  var search = req.param('search', {value:"", regex:""});

  database('accounts')
    .where('username', 'like', search.value + "%")
    .orWhere('domain', 'like', search.value + "%")
    .paginate(length, start, true)
    .then(function(result) {
      res.json({
        "draw": result.per_page,
        "recordsTotal": result.total,
        "recordsFiltered": result.per_page,
        "data": result.data
      });
    })
    .catch(function(err) {
      next(err);
    });
});

//
// タグ一覧取得
router.use("/tags", isAuthenticated, function(req, res, next) {

  var start = req.param('start', 0);
  var length = req.param('length', 10);

  var search = req.param('search', {value:"", regex:""});

  database('tags')
    .select('name')
    .count({count: 'name'})
    .max({last_use: 'updated_at'})
    .where('name', 'like', search.value + "%")
    .groupBy('name')
    .paginate(length, start, true)
    .then(function(result) {
      res.json({
        "draw": result.per_page,
        "recordsTotal": result.total,
        "recordsFiltered": result.per_page,
        "data": result.data
      });
    })
    .catch(function(err) {
      next(err);
    });
});


module.exports = router;