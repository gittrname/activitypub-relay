var express = require('express');
var validator = require('validator');
var database = require('../database');
var influx = require('../influx');
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
// 月別配信数
router.use("/delivery/monthly", isAuthenticated, function(req, res, next) {

  Promise.all([
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 31d and time < now()"
      + " group by time(1d)"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 31d and time < now()"
      + " and result = true"
      + " group by time(1d)"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 31d and time < now()"
      + " and result = false"
      + " group by time(1d)"
    ),
  ])
  .then(function(result) {
    res.json({
      "total": result[0],
      "complite": result[1],
      "failure": result[2],
    });
  })
  .catch(function(err) {
    next(err);
  });
});

//
// 週別配信数
router.use("/delivery/weekly", isAuthenticated, function(req, res, next) {

  Promise.all([
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 7d and time < now()"
      + " group by time(1d)"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 7d and time < now()"
      + " and result = true"
      + " group by time(1d)"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 7d and time < now()"
      + " and result = false"
      + " group by time(1d)"
    ),
  ])
  .then(function(result) {
    res.json({
      "total": result[0],
      "complite": result[1],
      "failure": result[2],
    });
  })
  .catch(function(err) {
    next(err);
  });
});

//
// 日別配信数
router.use("/delivery/daily", isAuthenticated, function(req, res, next) {

  Promise.all([
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 1d and time < now()"
      + " group by time(1h) order by desc"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 1d and time < now()"
      + " and result = true"
      + " group by time(1h) order by desc"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 1d and time < now()"
      + " and result = false"
      + " group by time(1h) order by desc"
    ),
  ])
  .then(function(result) {
    res.json({
      "total": result[0],
      "complite": result[1],
      "failure": result[2],
    });
  })
  .catch(function(err) {
    next(err);
  });
});

//
// インスタンス毎の配信数
router.use("/delivery/instance", isAuthenticated, function(req, res, next) {

  Promise.all([
    influx.query(
      "select  from forward"
      + " where time > now() - 1d and time < now()"
      + " group by time(1h) order by desc"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 1d and time < now()"
      + " and result = true"
      + " group by time(1h) order by desc"
    ),
    influx.query(
      "select count(result) from forward"
      + " where time > now() - 1d and time < now()"
      + " and result = false"
      + " group by time(1h) order by desc"
    ),
  ])
  .then(function(result) {
    res.json({
      "domain": result[0],
      "complite": result[1],
      "failure": result[2],
    });
  })
  .catch(function(err) {
    next(err);
  });
});

//
// インスタンス一覧取得
router.use("/instances", isAuthenticated, function(req, res, next) {

  var start = (req.query.start)?req.query.start:0;
  var length = (req.query.length)?req.query.length:10;

  var search = (req.query.search)?req.query.search:{value:"", regex:""};
  var order = (req.query.order[0])?req.query.order[0]:{column:"", dir:""};

  var column = (req.query.columns)?req.query.columns:[{data:""}];

  Promise.all([
    database('relays')
      .where('domain', 'like', search.value + "%")
      .limit(length)
      .offset(start)
      .orderBy(column[order.column].data, order.dir)
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
  var order = (req.query.order[0])?req.query.order[0]:{column:"", dir:""};

  var column = (req.query.columns)?req.query.columns:[{data:""}];

  Promise.all([
    database('accounts')
      .leftOuterJoin('followers', 'accounts.id', 'followers.account_id')
      .where('accounts.username', 'like', search.value + "%")
      .orWhere('accounts.domain', 'like', search.value + "%")
      .limit(length)
      .offset(start)
      .orderBy(column[order.column].data, order.dir)
      .select('accounts.id', 'accounts.username', 'accounts.domain', 'accounts.created_at', 'accounts.updated_at','followers.account_id'),
    database('accounts')
      .leftOuterJoin('followers', 'accounts.id', 'followers.account_id')
      .count()
      .first(),
    database('accounts')
      .leftOuterJoin('followers', 'accounts.id', 'followers.account_id')
      .where('accounts.username', 'like', search.value + "%")
      .orWhere('accounts.domain', 'like', search.value + "%")
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


module.exports = router;