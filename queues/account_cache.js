var LruCache = require('lru-cache');
var request = require('request');
var url = require('url');

var database = require('../database');

var cache = new LruCache({
  max: 200,
  maxAge: 60 * 60 * 1000  // 1H
});

var cacheAccount = function(keyId) {

  return new Promise(function(resolve, reject) {

    if (cache.has(keyId)) {
      console.log('has cache. ['+keyId+']');

      // キャッシュがあればそれで
      resolve(cache.get(keyId));
    } else {
      console.log('no cache. ['+keyId+']');

      // DB
      return database('accounts').select()
        .where({url: keyId})
        .then(function(rows) {
          if (rows.length == 0) {
            console.log('no found. ['+keyId+']');

            // Httpリクエストで取得する
            return accountRequest(keyId);
          } else {
            console.log('found. ['+keyId+']');

            // 取得したものを返却
            return Promise.resolve(rows);
          }
        })
        .then(function(rows) {
          // キャッシュに保存
          cache.set(keyId, rows[0]);

          // 取得したアカウントをコールバックに返却
          resolve(rows[0]);
        })
        .catch(function(err) {
          reject(err);
        });
    }
  });
};

//
//
var accountRequest = function(keyId) {

  var options = {
    url: keyId,
    method: 'GET',
    headers: {'Accept': 'application/activity+json, application/ld+json'},
    json: true
  };

  return new Promise(function(resolve, reject) {

    request(options, function(err, res, data) {

      if (err) {
        return reject(err);
      }

      // レコード作成
      var accountUrl = url.parse(data.id);
      var row = {
        'username': data.preferredUsername,
        'domain': accountUrl.domain,
        'private_key': '',
        'public_key': data.publicKey.publicKeyPem,
        
        'display_name': (data.name)?data.name:'',
        'note': (data.summary)?data.summary:'',
        'uri': data.id,
        'url': keyId,
        'avatar_remote_url': (data.icon)?data.icon.url:'',
        'header_remote_url': (data.image)?data.image.url:'',
        
        'inbox_url': data.inbox,
        'outbox_url': data.outbox,
        'shared_inbox_url': data.endpoints.sharedInbox,
        'shared_outbox_url': '',
        'followers_url': data.followers,
        'following_url': data.following,
        
        'actor_type': data.type,
        'discoverable': true
      };

      resolve([row]);
    });
  });
};

module.exports = cacheAccount;