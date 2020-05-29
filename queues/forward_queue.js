var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');
var database = require('../database');
var influx = require('../influx');
var config = require('../settings');

//
//
module.exports = function(job) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
      
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  // 転送Activity
  var forwardActivity = Activity.parse(client.body);

  console.log('start forward queue process. keyId='+signParams['keyId']);

  // リクエスト元の公開鍵取得
  return accountCache(signParams['keyId'])
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
        .innerJoin('accounts', 'relays.account_id', 'accounts.id')
        .whereNot({'accounts.domain': account['domain']})
        .then(function(rows) {
          for(idx in rows) {
            var inboxUrl = rows[idx]['inbox_url'];

            // 転送
            console.log('Forward Activity.'
              +' form='+account['uri']+' to='+inboxUrl);
            // 単純フォーワード
            subscriptionMessage
              .sendActivity(inboxUrl, forwardActivity)
              .then(function(res) {

                if (res.statuscode == 200 || res.statuscode == 201) {
                  // 配信成功を結果ログに記録
                  subscriptionLog('forward',
                    forwardActivity.id, inboxUrl, true);
                } else if (res.statuscode == 410) {
                  // 配送先から取り消す
                  database('relays').where('id', rows[idx]['id']).del();
                } else {
                  // 配信失敗を結果ログに記録
                  subscriptionLog('forward',
                    forwardActivity.id, inboxUrl, false);
                }
              })
              .catch(function(err) {
                // 配信失敗を結果ログに記録
                subscriptionLog('forward',
                  forwardActivity.id, inboxUrl, false);
              });
          }

          return Promise.resolve(account);
        });

      // 
      return Promise.resolve(account);
    })
    .then(function(account) {

      // フォロー先一覧取得
      database('followers')
        .innerJoin('accounts', 'followers.account_id', 'accounts.id')
        .whereNot({'accounts.domain': account['domain']})
        .then(function(rows) {
          for(idx in rows) {
            var inboxUrl = rows[idx]['inbox_url'];

            // 転送
            console.log('Boost Activity.'
              +' form='+account['uri']+' to='+inboxUrl);
            // 単純フォーワード
            //subscriptionMessage.sendActivity(
            //    inboxUrl, forwardActivity);
            // ブースト
            subscriptionMessage
              .sendActivity(inboxUrl, forwardActivity)
              .then(function(res) {

                if (res.statuscode == 200 || res.statuscode == 201) {
                  // 配信成功を結果ログに記録
                  subscriptionLog('forward',
                    forwardActivity.id, inboxUrl, true);
                } else if (res.statuscode == 410) {
                  // 配送先から取り消す
                  database('followers').where('id', rows[idx]['id']).del();
                } else {
                  // 配信失敗を結果ログに記録
                  subscriptionLog('forward',
                    forwardActivity.id, inboxUrl, false);
                }
              })
              .catch(function(err) {
                // 配信失敗を結果ログに記録
                subscriptionLog('forward',
                  forwardActivity.id, inboxUrl, false);
              });
          }

          return Promise.resolve(rows);
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

      return Promise.resolve(account);
    })
    .catch(function(err) {
      console.log(err);
      return reject(err);
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