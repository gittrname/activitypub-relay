var express = require('express');
var validator = require('validator');
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


module.exports = router;