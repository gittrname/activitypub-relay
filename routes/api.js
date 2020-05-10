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

  var start = (req.query.start)?req.query.start:0;
  var length = (req.query.length)?req.query.length:10;

  var search = (req.query.search)?req.query.search:{value:"", regex:""};

  Promise.all([
    database('relays')
      .where('domain', 'like', search.value + "%")
    . limit(length)
      .offset(start)
      .select(),
    database('relays')
      .count()
      .first(),
    database('relays')
      .where('domain', 'like', search.value + "%")
      .count()
      .first(),
  ])
  .then(function(result) {
    res.json({
      "draw": Number(req.query.draw),
      "recordsTotal": Number(result[1].count),
      "recordsFiltered": Number(result[2].count),
      "data": result[0]
    });
  })
  .catch(function(err) {
    next(err);
  });
});

//
// アカウント一覧取得
router.use("/accounts", isAuthenticated, function(req, res, next) {

  var start = (req.query.start)?req.query.start:0;
  var length = (req.query.length)?req.query.length:10;

  var search = (req.query.search)?req.query.search:{value:"", regex:""};

  Promise.all([
    database('accounts')
      .where('username', 'like', search.value + "%")
      .orWhere('domain', 'like', search.value + "%")
      .limit(length)
      .offset(start)
      .select(),
    database('accounts')
      .count()
      .first(),
    database('accounts')
      .where('username', 'like', search.value + "%")
      .orWhere('domain', 'like', search.value + "%")
      .count()
      .first(),
  ])
  .then(function(result) {
    res.json({
      "draw": Number(req.query.draw),
      "recordsTotal": Number(result[1].count),
      "recordsFiltered": Number(result[2].count),
      "data": result[0]
    });
  })
  .catch(function(err) {
    next(err);
  });
});

//
// タグ一覧取得
router.use("/tags", isAuthenticated, function(req, res, next) {

  var start = (req.query.start)?req.query.start:0;
  var length = (req.query.length)?req.query.length:10;

  var search = (req.query.search)?req.query.search:{value:"", regex:""};

  Promise.all([
    database('tags')
      .select('name')
      .count('name', {as: 'count'})
      .max('updated_at', {as: 'last_use'})
      .where('name', 'like', search.value + "%")
      .where('type', 'Hashtag')
      .groupBy('name')
      .limit(length)
      .offset(start)
      .select(),
    database('tags')
      .count()
      .first(),
    database('tags')
      .where('name', 'like', search.value + "%")
      .where('type', 'Hashtag')
      .count('name')
      .first(),
  ])
  .then(function(result) {
    res.json({
      "draw": Number(req.query.draw),
      "recordsTotal": Number(result[1].count),
      "recordsFiltered": Number(result[2].count),
      "data": result[0]
    });
  })
  .catch(function(err) {
    next(err);
  });
});


module.exports = router;