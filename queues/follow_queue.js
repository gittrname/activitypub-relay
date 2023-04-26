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

  return await new Promise(function(resolve, reject) {

    // // Signatureの正当性チェック
    // if (!Signature.verifyRequest(account['public_key'], client)) {

    //   // 拒否応答
    //   subscriptionMessage.sendActivity(
    //     account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));

    //   return reject(new Error('Invalid signature. keyId='+signParams['keyId']));
    // } else {

    //   return resolve();
    // }
    return resolve();
  })
  .then(function(res) {

      // すでにRelay登録されていないか確認
      return database('relays')
        .select()
        .where({
          'account_id': account['id'],
          'domain': account['domain']
        })
        .then(function(rows) {

          if (rows.length <= 0) {
            return database('relays')
              .insert({
                'account_id': account['id'],
                'domain': account['domain'],
                'status': 1
              });
          }
        });
    })
    .then(function(res) {

      // 承認応答
      console.log('Send Accept Activity. target='+account['shared_inbox_url']);
      return subscriptionMessage.sendActivity(
        account['shared_inbox_url'], activity.accept(client.body));
    })
    .catch(function(err) {
      console.log(err);
      done(err);
    })
    .finally(function() {
      done();
    });
};
