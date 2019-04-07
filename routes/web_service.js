var url = require('url');
var xmlBuilder = require('xmlbuilder');
var express = require('express');
var router = express.Router();

var Actor = require('../activitypub/actor');
var Activity = require('../activitypub/activity');

// 設定ロード
var config = require('../config/settings');
var keyPair = require('../config/relay_keypair.json');

// キュー処理生成
var Queue = require('bull');
var followQueue = new Queue('follow', config.redis);
followQueue.process(
  require('../queues/follow_queue')
);
var unfollowQueue = new Queue('unfollow', config.redis);
unfollowQueue.process(
  require('../queues/unfollow_queue')
);
var forwardQueue = new Queue('forward', config.redis);
forwardQueue.process(
  config.queue.pool,
  require('../queues/forward_queue')
);


//
// Webfinger
var relayUrl = url.parse(config.relay.url);
var accountUri = 'acct:'+config.relay.account+'@'+relayUrl.host;
router.get('/.well-known/webfinger', function (req, res, next) {

  if (!req.query.resource) {
    var error = new Error('Resource query parameter not present.');
    error.status = 400;
    return next(error);
  }
  if (req.query.resource != accountUri) {
    var error = new Error('Resource not found.');
    error.status = 404;
    return next(error);
  }

  var obj = {
    'subject': accountUri,
    'links': [
      {
        'rel':  'self',
        'type': 'application/activity+json',
        'href': config.relay.url+'/actor'
      },
    ]
  };

  res.set('Content-Type', 'application/json').json(obj);
});
router.get('/.well-known/host-meta', function(req, res, next) {

  var xml = xmlBuilder.create('XRD', {'xmlns': 'http://docs.oasis-open.org/ns/xri/xrd-1.0'})
    .ele('Link', {'rel': 'lrdd', 'type':'application/xrd+xml', 'template': config.relay.url+'/.well-known/webfinger?resource='+accountUri})
  .end({ pretty: true});

  res.set('Content-Type', 'application/xml').send(xml).end();
});

//
// Actor
router.get('/actor', function (req, res, next) {

  //
  var actor = new Actor(config.relay.url);

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
router.post('/inbox', function (req, res, next) {

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
      followQueue.add({
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

      // キューに格納
      unfollowQueue.add({
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

      // キューに格納
      forwardQueue.add({
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


module.exports = router;
