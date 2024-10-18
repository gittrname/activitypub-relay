var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');

var database = require('../database');
var cache = require('../cache');

var config = require('../settings');

//
var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
var activity = new Activity(config.relay);

//
//
module.exports = async function(job, done) {

  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  console.log('start unfollow queue process. keyId='+signParams['keyId']);

  // リクエスト元の公開鍵取得
  var account;
  try {
    account = await accountCache(signParams['keyId']);
  } catch (e) {
    console.log(e.message);
    return done(e);
  }
  
  // Signatureの正当性チェック
  if (!Signature.verifyRequest(account['public_key'], client)) {

    // 拒否応答
    try {
      await subscriptionMessage.sendActivity(
        account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));
    } catch (e) {
      console.log(e.message);
      return done(e);
    }
  }

  // すでにRelay登録されていないか確認
  const relayRows = await database('relays')
    .select('id')
    .where({
      account_id: account['id'],
      domain: account['domain']
    });
  if (relayRows.length > 0) {  // 削除する
    console.log('This relay is remove follow. targetId='+signParams['keyId']);

    // id リスト
    idList = [];
    for(var i in relayRows) {
      idList.push(relayRows[i]['id']);
    }

    //
    // DB削除
    await database('relays')
      .delete()
      .whereIn('id', idList)
      .catch(function(e) {
        console.log(e);
        //　削除できなくてもアンフォロー処理は続ける
      });
  } else {
    console.log('This relay is not follow. targetId='+signParams['keyId']);
  }

  // すでにFollowers登録されていないか確認
  const followerRows = await database('followers')
    .select('id')
    .where({
      account_id: account['id'],
      domain: account['domain']
    });
  if (followerRows.length > 0) {
    console.log('This relay is remove follow. targetId='+signParams['keyId']);

    // id リスト
    idList = [];
    for(var i in followerRows) {
      idList.push(followerRows[i]['id']);
    }

    //
    cache.del(signParams['keyId']);

    //
    // DB削除
    await database('followers')
      .delete()
      .whereIn('id', idList)
      .catch(function(e) {
        console.log(e);
        //　削除できなくてもアンフォロー処理は続ける
      });
  } else {
    console.log('This relay is not follow. targetId='+signParams['keyId']);
  }

  //
  // 承認リクエスト送付
  console.log('Send Accept Activity. targetId='+account['shared_inbox_url']);
  try {
    await subscriptionMessage.sendActivity(
      account['shared_inbox_url'], activity.accept(client.body));
  } catch(e) {
    console.log(e.message);
    return done(e);
  }

  return done();
};
