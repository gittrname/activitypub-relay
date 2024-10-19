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
    activity = new Activity(settings.relay);
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
  
  
  const reusltList = [];
  const undeliveryList = [];
  for(idx in domains) {
    const target = domains[idx];
    try {
      await subscriptionMessage
        .sendActivity(target['inbox_url'], forwardActivity);
      
      // 結果を記録
      reusltList.push({
        measurement: 'forward',
        tags: {inbox_url: target['inbox_url']},
        fields: {id: forwardActivity.id, result: true}
      })

      console.log('Forward Success.'
        +' from='+account['uri']+' to='+target['inbox_url']);
    } catch (err) {
      console.log('Forward Fail. ['+err.message+']'
        +' from='+account['uri']+' to='+target['inbox_url']);
      
      // 401 Goneの場合は配送停止対象に記録
      if (err.message=="Gone") {
        undeliveryList.push(target);
      }
      
      // 結果を記録
      reusltList.push({
        measurement: 'forward',
        tags: {inbox_url: err.url},
        fields: {id: forwardActivity.id, result: false}
      })
    }
  }

  // 配信結果を集計DBに記録
  try {
    await influx.writePoints(reusltList);
  } catch(e) {
    console.log(err.message);
  }

  // 配信停止処理
  for (idx in undeliveryList) {
    try {
      // 所属する配送先取得
      const relayIds = await database('relays')
        .select('relays.id')
        .innerJoin('accounts', 'relays.account_id', 'accounts.id')
        .where({'accounts.inbox_url': undeliveryList[idx]["inbox_url"]});

      // 配送停止処理
      for(i in relayIds) {
        await database('relays')
          .where('id', relayIds[i]['id'])
          .update({'status': 0});
      }
    } catch (e) {
      console.log(e.message);
    }
  }
  
  done();
};