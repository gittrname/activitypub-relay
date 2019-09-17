var request = require('request');

var database = require('../database');
var cache = require('../cache');

//
//
module.exports = function(keyId) {

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

          if (!rows[0]['id']) {
            // DBに登録
            return database('accounts')
                .insert(rows[0])
                .returning('*');
          } else {
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
// アカウント情報取得
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
      if (!data) {
        return reject(new Error('no response.'));
      }
      if (!data=={}) {
        return reject(new Error('no response.'));
      }

      // レコード作成
      var row = {
        'username': data.preferredUsername,
        'domain': res.request.host,
        'private_key': '',
        'public_key': (data.publicKey)?data.publicKey.publicKeyPem:'',
        
        'display_name': (data.name)?data.name:'',
        'note': (data.summary)?data.summary:'',
        'uri': data.id,
        'url': keyId,
        'avatar_remote_url': (data.icon)?data.icon.url:'',
        'header_remote_url': (data.image)?data.image.url:'',
        
        'inbox_url': data.inbox,
        'outbox_url': data.outbox,
        'shared_inbox_url': (data.endpoints)?data.endpoints.sharedInbox:'',
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