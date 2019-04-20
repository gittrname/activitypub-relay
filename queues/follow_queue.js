var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');

var database = require('../database');

var config = require('../settings');

//
//
module.exports = function(job) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
  var activity = new Activity(config.relay);
  
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
          account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));
      }

      // すでにRelay登録されていないか確認
      database('relays')
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
                'domain': account['domain']
              });
          }
        });

      // 承認応答
      console.log('Send Accept Activity. target='+account['shared_inbox_url']);
      return subscriptionMessage.sendActivity(
        account['shared_inbox_url'], activity.accept(client.body));
    })
    .catch(function(err) {
      console.log(err.message);
    });
};
