var axios = require('axios');

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

  return axios(options)
    .then(function(res) {

      // レコード作成
      return [
          {
          'username': res.data.preferredUsername,
          'domain': res.request.host,
          'private_key': '',
          'public_key': (res.data.publicKey)?res.data.publicKey.publicKeyPem:'',
          
          'display_name': (res.data.name)?res.data.name:'',
          'note': (res.data.summary)?res.data.summary:'',
          'uri': res.data.id,
          'url': keyId,
          'avatar_remote_url': (res.data.icon)?res.data.icon.url:'',
          'header_remote_url': (res.data.image)?res.data.image.url:'',
          
          'inbox_url': res.data.inbox,
          'outbox_url': res.data.outbox,
          'shared_inbox_url': (res.data.endpoints)?res.data.endpoints.sharedInbox:'',
          'shared_outbox_url': '',
          'followers_url': res.data.followers,
          'following_url': res.data.following,
          
          'actor_type': res.data.type,
          'discoverable': true
        }
      ];
    })
    .catch(function(err) {
      return err;
    });
};