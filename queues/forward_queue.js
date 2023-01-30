var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');
var database = require('../database');
var influx = require('../influx');
var config = require('../settings');
const settings = require('../settings');

//
var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
var activity = new Activity(config.relay);

//
//
module.exports = function(job, done) {
      
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  // 転送Activity
  var forwardActivity = Activity.parse(client.body);
  // ブーストActivity
  var boastActivity = activity.announce(client.body);

  console.log('start forward queue process. keyId='+signParams['keyId']);

  // リクエスト元の公開鍵取得
  return accountCache(signParams['keyId'])
    .then(function(account) {

      // // Signatureの正当性チェック
      // if (!Signature.verifyRequest(account['public_key'], client)) {

      //   // 拒否応答
      //   subscriptionMessage.sendActivity(
      //     account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));

      //   throw new Error('Invalid signature. keyId='+signParams['keyId']);
      // } else {
      
        // 配送処理
        const deliveryPromise = new Promise(function(resolve, reject) {
    
          // リレー先一覧取得
          return database('relays')
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
    
              // 配送Promiseリスト作成
              const promises = [];
              for(idx in rows) {
                promises.push(
                  subscriptionMessage
                    .sendActivity(rows[idx]['inbox_url'], forwardActivity)
                    .then(function(res) {
                      forwardSuccessFunc(res, forwardActivity.id, account);
                    })
                    .catch(function(err) {
                      forwardFailFunc(err, forwardActivity.id, account);
                    })
                );
              }
        
              // 配送実行
              return Promise.allSettled(promises);
            });
        });

        // 配送復帰処理
        const reinstatementPromise = database('relays')
          .where({'domain': account['domain']})
          .where('status', 0)
          .then(function(rows) {
            const promises = []
            for(idx in rows) {
              // 配送先状態を変更する
              promises.push(
                database('relays')
                  .where('id', rows[idx]['id'])
                  .update({'status': 1}).catch(function(err) {
                    console.log(err.message);
                  })
              );
            }

            return Promise.allSettled(promises);
          });

        done();

        // 同期実行
        return Promise.all([
          deliveryPromise,
          reinstatementPromise
        ]);
      // }
    })
    .catch(function(err) {
      console.log(err);
    });
};

/**
 * 配信成功処理
 */
const forwardSuccessFunc = function(res, activityId, account) {
    
  console.log('Forward Success.'
  +' form='+account['uri']+' to='+res.config.url);

  // 配信成功を結果ログに記録
  return influx.writePoints([
    {
      measurement: 'forward',
      tags: {inbox_url: res.config.url},
      fields: {id: activityId, result: true}
    }
  ])
  .catch(function(err) {
    console.log(err.message);
  })
};

/**
 * 配信失敗処理
 */
const forwardFailFunc = function(err, activityId, account) {

  console.log('Forward Fail. ['+err.message+']'
  +' form='+account['uri']+' to='+err.config.url);

  // 配送ステータス更新処理
  const forwardStatusUpdate = function() {
    return database('relays')
      .select('relays.id')
      .innerJoin('accounts', 'relays.account_id', 'accounts.id')
      .where({'accounts.inbox_url': err.config.url})
      .then(function(relayIds) {
        const list = [];
        for(i in relayIds) {
          list.push(
            database('relays')
              .where('id', relayIds[i]['id']).whereNot('status', 0)
              .update({'status': 0}).catch(function(err) {
                console.log(err.message);
              })
          );
        }

        return Promise.all(list);
      });
  };

  // 配信失敗を結果ログに記録
  return influx.writePoints([
    {
      measurement: 'forward',
      tags: {inbox_url: err.config.url},
      fields: {id: activityId, result: false}
    }
  ])
  .catch(function(err) {
    console.log(err.message);
  })
  .finally(function() {

    // 配送不能ドメインのステータスを変更
    if (err.response == undefined){
      //console.log('ERROR CODE: ' + err.code);
      if (err.code == 'ENOTFOUND') {
        // ドメイン逆引きエラー
        if (settings.queue.auto_unforward) { forwardStatusUpdate() };
      } else if (err.code == 'ERR_BAD_RESPONSE') {
        // レスポンス不正
        if (settings.queue.auto_unforward) { forwardStatusUpdate() };
      }
    } else if (err.response.status < 500) {
      // 400番台エラー
        if (settings.queue.auto_unforward) { forwardStatusUpdate() };
    }
   });
};