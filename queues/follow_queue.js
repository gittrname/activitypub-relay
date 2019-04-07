var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');

var database = require('../database');

var config = require('../config/settings');
var keyPair = require('../config/relay_keypair.json');

//
//
module.exports = function(job) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.url, keyPair.private);
  var activity = new Activity(config.relay.url);
  
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  console.log('start follow queue process. keyId='+signParams['keyId']);

  //
  return accountCache(signParams['keyId'])
    .then(function(account) {
      
      // Signatureの正当性チェック
      if (!Signature.verifyRequest(account['public_key'], client)) {
        console.log('Invalid signature. keyId='+signParams['keyId']);
  
        // 拒否応答
        return subscriptionMessage.sendActivity(
          account['shared_inbox_url'], activity.reject(signParams['keyId'], 'Follow'));
      }

      // すでにRelay登録されていないか確認
      database('accounts')
        .select()
        .where({url: account.url})
        .then(function(rows) {
  
          if (rows.length <= 0) {
            // DBに登録
            return database('accounts')
              .insert(account);
          }
        });

      // 承認応答
      console.log('Send Accept Request. targetId='+signParams['keyId']);
      return subscriptionMessage.sendActivity(
        account['shared_inbox_url'], activity.accept(Activity.parse(client.body)));
    })
    .catch(function(err) {
      console.log(err.message);
    });
};
