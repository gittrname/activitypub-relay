var url = require('url');
var xmlBuilder = require('xmlbuilder');
var express = require('express');
var router = express.Router();

var Actor = require('../activitypub/actor');
var Activity = require('../activitypub/activity');

//
var Worker = require('../worker');

// 設定ロード
var config = require('../settings');
var keyPair = require('../keypair/relay_keypair.json');


//
// Webfinger
router.get('/.well-known/webfinger', function (req, res, next) {

  if (!req.query.resource) {
    var error = new Error('Resource query parameter not present.');
    error.status = 400;
    return next(error);
  }
  if (req.query.resource != config.relay.account) {
    var error = new Error('Resource not found.');
    error.status = 404;
    return next(error);
  }

  var obj = {
    'subject': config.relay.account,
    'links': [
      {
        'rel':  'self',
        'type': 'application/activity+json',
        'href': config.relay.actor
      },
    ]
  };

  res.set('Content-Type', 'application/json').json(obj);
});
router.get('/.well-known/host-meta', function(req, res, next) {

  var xml = xmlBuilder.create('XRD', {'xmlns': 'http://docs.oasis-open.org/ns/xri/xrd-1.0'})
    .ele('Link', {'rel': 'lrdd', 'type':'application/xrd+xml', 'template': config.relay.url+'/.well-known/webfinger?resource='+config.relay.account})
  .end({ pretty: true});

  res.set('Content-Type', 'application/xml').send(xml).end();
});

//
// Actor
router.get('/actor', function (req, res, next) {

  //
  var actor = new Actor(config.relay);

  //
  res.set('Content-Type', 'application/activity+json')
    .send(JSON.stringify(actor.myself(keyPair.public)))
    .end();
});

//
// Status
router.get('/status', function(req, res, next) {

  res.set('Content-Type', 'application/json')
    .end();
});

//
// inbox
router.post('(/|//)inbox', function (req, res, next) {

  // ヘッダーの検証
  if (!req.headers['content-type'] || req.headers['content-type'] != "application/activity+json") {
    var error = new Error('Invalid Request: Not Allowed Content-Type.');
    error.status = 400;
    return next(error);
  }
  if (!req.headers['signature']) {
    var error = new Error('Invalid Request: Not found Signature header.');
    error.status = 400;
    return next(error);
  }
  if (!req.headers['digest']) {
    var error = new Error('Invalid Request: Not found Digest header.');
    error.status = 400;
    return next(error);
  }
  
  // Activity
  var activity = Activity.parse(req.rawBody);

  // リクエスト種別に応じて処理を分岐
  switch(activity.type) {
    case "Follow":
      console.log('queuing follow request. [actor:'+activity.actor+']');

      // キューに格納
      Worker.followQueue.add({
        client: {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.rawBody
        }
      });
      break;

    case "Undo":
      console.log('queuing unfollow request. [actor:'+activity.actor+']');

      // // キューに格納
      Worker.unfollowQueue.add({
        client: {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.rawBody
        }
      });
      break;
    
    case "Create":
    case "Update":
    case "Delete":
    case "Announce":
      console.log('queuing forward request. [actor:'+activity.actor+']');

      // // キューに格納
      Worker.forwardQueue.add({
        client: {
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.rawBody
        }
      });
      break;

    default:

      var error = new Error('Invalid Request Type.');
      error.status = 400;
      return next(error);
  }

  res.status(202).end();
});

router.post('(/|//)outbox', function (req, res, next) {

  res.status(202).end();
});


module.exports = router;
