var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');

var database = require('../database');

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

  console.log('start follow queue process. keyId='+signParams['keyId']);

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
  const rows = await database('relays')
    .select()
    .where({
      'account_id': account['id'],
      'domain': account['domain']
    });
  if (rows.length <= 0) { // 未登録なら登録
    try {
      await database('relays')
        .insert({
          'account_id': account['id'],
          'domain': account['domain'],
          'status': 1
        });
    } catch(e) {
      console.log(e.message);
      return done(e);
    }
  }

  // 承認応答
  console.log('Send Accept Activity. target='+account['shared_inbox_url']);
  try {
    await subscriptionMessage.sendActivity(
      account['shared_inbox_url'], activity.accept(client.body));
  } catch(e) {
    console.log(e.message);
    return done(e);
  }
  
  return done();
};
