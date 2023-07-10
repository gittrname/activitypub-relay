var fetch = require('node-fetch');
var url = require('url');

var database = require('../database');
var cache = require('../cache');

//
//
module.exports = async function(keyId) {

    if (cache.has(keyId)) {
      console.log('has cache. ['+keyId+']');

      // キャッシュがあればそれで
      return cache.get(keyId);
    } else {
      console.log('no cache. ['+keyId+']');

      // DB
      return database('accounts').select()
        .where({url: keyId})
        .then(function(rows) {
          if (rows.length == 0) {
            console.log('no found. ['+keyId+']');

            // Httpリクエストで取得する
            try {
              return accountRequest(keyId);
            } catch (err) {
              throw err;
            }
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
          return rows[0];
        })
    }
};

//
// アカウント情報取得
var accountRequest = async function(keyId) {

  var options = {
    method: 'GET',
    headers: {'Accept': 'application/activity+json, application/ld+json'},
    json: true
  };

  var json = await fetch(keyId, options)
    .then(function(res) {
      if (!res.ok) {
        throw new Error('Response fail.[' + res.status + ']');
      } else {
        return res.json();
      }
    });

    // domain
    var keyUrl = url.parse(keyId);

    // レコード作成
    return [
        {
        'username': json.preferredUsername,
        'domain': keyUrl.host,
        'private_key': '',
        'public_key': (json.publicKey)?json.publicKey.publicKeyPem:'',

        'display_name': (json.name)?json.name:'',
        'note': (json.summary)?json.summary:'',
        'uri': json.id,
        'url': keyId,
        'avatar_remote_url': (json.icon)?json.icon.url:'',
        'header_remote_url': (json.image)?json.image.url:'',

        'inbox_url': json.inbox,
        'outbox_url': json.outbox,
        'shared_inbox_url': (json.endpoints)?json.endpoints.sharedInbox:'',
        'shared_outbox_url': '',
        'followers_url': json.followers,
        'following_url': json.following,

        'actor_type': json.type,
        'discoverable': true
      }
    ];
};
