var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');
var filter = require('../filter');
var database = require('../database');
var influx = require('../influx');
var settings = require('../settings');

//
var subscriptionMessage = new SubscriptionMessage(settings.relay.actor, settings.relay.privateKey);

//
//
module.exports = async function(job, done) {

  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  // 転送Activity
  var forwardActivity = Activity.parse(client.body);

  console.log('start forward queue process. keyId='+signParams['keyId']);

  // リクエスト元の公開鍵取得
  var account;
  try {
    account = await accountCache(signParams['keyId']);
  } catch (e) {
    console.log(e.message);
    return done(e);
  }

  // フィルターチェック
  const fintering = await filter(account, forwardActivity);
  if (fintering) {
    console.log('Filtering activity.');
    return done(new Error('Filtering activity.'));
  }
  
  // Signatureの正当性チェック
  if (!Signature.verifyRequest(account['public_key'], client)) {

    // 拒否応答
    subscriptionMessage.sendActivity(
      account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));

      console.log('Invalid signature.');
      return done(new Error('Invalid signature. keyId='+signParams['keyId']));
  }

  // 配送復帰処理
  try {
    var domains = await database('relays')
        .where({'domain': account['domain']})
        .where('status', 0);

    for(idx in domains) {
      // 配送先状態を変更する
      await database('relays')
          .where('id', domains[idx]['id'])
          .update({'status': 1})
    }
  } catch(err) {
    console.log(err.message);
  }

  // 配送処理
  var domains = await database('relays')
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
    .where('relays.status', 1);
  
  for(idx in domains) {
    const target = domains[idx]
    subscriptionMessage
      .sendActivity(target['inbox_url'], forwardActivity)
      .then(function(res) {
        forwardSuccessFunc(res, forwardActivity.id, account, target);
      })
      .catch(function(err) {
        forwardFailFunc(err, forwardActivity.id, account, target);
      });
  }
  
  done();
};

/**
 * 配信成功処理
 */
const forwardSuccessFunc = function(res, activityId, from, to) {

  console.log('Forward Success.'
  +' from='+from['uri']+' to='+to['inbox_url']);

  // 配信成功を結果ログに記録
  return influx.writePoints([
    {
      measurement: 'forward',
      tags: {inbox_url: to['inbox_url']},
      fields: {id: activityId, result: true}
    }
  ])
  .catch(function(e) {
    console.log(e.message);
  });
};

/**
 * 配信失敗処理
 */
const forwardFailFunc = function(err, activityId, from, to) {

  console.log('Forward Fail. ['+err.message+']'
  +' from='+from['uri']+' to='+to['inbox_url']);

  // 配送ステータス更新処理
  const forwardStatusUpdate = function() {
    return database('relays')
      .select('relays.id')
      .innerJoin('accounts', 'relays.account_id', 'accounts.id')
      .where({'accounts.inbox_url': to['inbox_url']})
      .then(function(relayIds) {
        var promises = [];
        for(i in relayIds) {
            promises.push(database('relays')
              .where('id', relayIds[i]['id']).whereNot('status', 0)
              .update({'status': 0}).catch(function(e) {
                console.log(e.message);
              })
            );
          return Promise.all(promises);
        }
      });
  };

  // 配信失敗を結果ログに記録
  return influx.writePoints([
    {
      measurement: 'forward',
      tags: {inbox_url: err.url},
      fields: {id: activityId, result: false}
    }
  ])
  .then(function(res) {

    // 配送不能ドメインのステータスを変更
    if (err.response == undefined){
      //console.log('ERROR CODE: ' + err.code);
      if (err.code == 'ENOTFOUND') {
        // ドメイン逆引きエラー
        if (settings.queue.auto_unforward) { return forwardStatusUpdate() };
      } else if (err.code == 'ERR_BAD_RESPONSE') {
        // レスポンス不正
        if (settings.queue.auto_unforward) { return forwardStatusUpdate() };
      } else if (err.code == 'ETIMEDOUT') {
        // 接続タイムアウト
        if (settings.queue.auto_unforward) { return forwardStatusUpdate() };
      } else {
        return res;
      }
    } else if (err.response.status == 410) {
      // 410エラー
      if (settings.queue.auto_unforward) { return forwardStatusUpdate() };
    } else if (err.response.status > 499) {
      // 500番台エラー
      if (settings.queue.auto_unforward) { return forwardStatusUpdate() };
    } else {
      return res;
    }
  })
  .catch(function(e) {
    console.log(e.message);
  });
};
