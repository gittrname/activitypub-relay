var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');
var database = require('../database');
var influx = require('../influx');
var config = require('../settings');

//
//
module.exports = function(job, done) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
      
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  // 転送Activity
  var forwardActivity = Activity.parse(client.body);
  // ブーストActivity
  var activity = new Activity(config.relay);
  var boastActivity = activity.announce(client.body);

  console.log('start forward queue process. keyId='+signParams['keyId']);

  // リクエスト元の公開鍵取得
  accountCache(signParams['keyId'])
    .then(function(account) {
        
      // // Signatureの正当性チェック
      // if (!Signature.verifyRequest(account['public_key'], client)) {
      //   var activity = new Activity(config.relay);

      //   // 拒否応答
      //   subscriptionMessage.sendActivity(
      //     account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));

      //   throw new Error('Invalid signature. keyId='+signParams['keyId']);
      // } else {

      //   // アカウントを返却
      //   return Promise.resolve(account);
      // }
      return Promise.resolve(account);

    })
    .then(function(account) {

      // リレー先一覧取得
      database('relays')
        .select([
          'relays.id',
          'relays.account_id',
          'relays.domain',
          'relays.created_at',
          'relays.updated_at',
          'relays.status',
          'accounts.username',
          'accounts.uri',
          'accounts.url',
          'accounts.inbox_url',
          'accounts.shared_inbox_url',
        ])
        .innerJoin('accounts', 'relays.account_id', 'accounts.id')
        .whereNot({'accounts.domain': account['domain']})
        .where('relays.status', 1)
        .then(function(rows) {

          for(idx in rows) {

            // 単純フォーワード
            console.log('Forward Activity.'
            +' form='+account['uri']+' to='+rows[idx]['inbox_url']);

            subscriptionMessage
              .sendActivity(rows[idx]['inbox_url'], forwardActivity)
              .then(function(res) {

                // 配信成功を結果ログに記録
                influx.writePoints([
                  {
                    measurement: 'forward',
                    tags: {inbox_url: res.config.url},
                    fields: {id: forwardActivity.id, result: true}
                  }
                ]);
              })
              .catch(function(err) {
                console.log(err.message);

                // 配信失敗を結果ログに記録
                influx.writePoints([
                  {
                    measurement: 'forward',
                    tags: {inbox_url: err.config.url},
                    fields: {id: forwardActivity.id, result: false}
                  }
                ]);

                // 配送不能ドメインのステータスを変更
                if (err.code == 'ETIMEDOUT') {
                  // タイムアウトはビジー状態として処理
                  return;
                } else if (err.code == 'ERR_BAD_RESPONSE'
                    && err.response.status >= 500) {
                  // 一時的な配送エラーとして処理
                  return;
                } else {
                  database('relays')
                    .select('relays.id')
                    .innerJoin('accounts', 'relays.account_id', 'accounts.id')
                    .where({'accounts.inbox_url': err.config.url})
                    .then(function(relayIds) {
                      for(i in relayIds) {
                        database('relays').where('id', relayIds[i]['id'])
                          .update({'status': 0}).catch(function(err) {
                            console.log(err.message);
                          });
                      }
                    });
                }
              });
          }

          return Promise.resolve(account);
        });

      // 
      return Promise.resolve(account);
    })
    .then(function(account) {

      // タグ付き投稿であるか確認
      if (!forwardActivity.object.tag) {
        return Promise.resolve(account);
      }

      // タグ登録
      for(idx in forwardActivity.object.tag) {
        console.log('insert hashtag.['+forwardActivity.object.tag[idx].name+']');

        database('tags').insert({
          type: forwardActivity.object.tag[idx].type,
          href: forwardActivity.object.tag[idx].href,
          name: forwardActivity.object.tag[idx].name
        });

        influx.writePoints([
          {
            measurement: 'hashtag',
            fields: {
              id: forwardActivity.id
            },
            tags: {
              name: forwardActivity.object.tag[idx].name,
              type: forwardActivity.object.tag[idx].type
            }
          }
        ])
        .catch(function(err) {
          console.log(err);
        });
      }

      // 
      return Promise.resolve(account);
    })
    .then(function(account) {

      // ドメインの配信状況確認
      database('relays')
        .where({'domain': account['domain']})
        .where('status', 0)
        .then(function(rows) {
          for(idx in rows) {
            // 配送先状態を変更する
            database('relays')
                .where('id', rows[idx]['id'])
                .update({'status': 1});
          }
        });
        
        // 
        return Promise.resolve(account);
    })
    .then(function(account) {
      // 処理終了
      return done();
    })
    .catch(function(err) {
      done(err);
    });
};

//
// Subscriptionの結果を記録する
function subscriptionLog(measurement, id, inboxUrl, result) {
  return influx.writePoints([
      {
        measurement: measurement,
        tags: {inbox_url: inboxUrl},
        fields: {id: id, result: result}
      }
    ])
    .catch(function(err) {
      console.log(err);
    });
}