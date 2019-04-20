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
            // 転送
            console.log('Forward Activity.'
              +' form='+account['uri']+' to='+rows[idx]['inbox_url']);
            subscriptionMessage.sendActivity(
                rows[idx]['inbox_url'], Activity.parse(client.body));  // 単純フォーワード
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
            // 転送
            console.log('Boost Activity.'
              +' form='+account['uri']+' to='+rows[idx]['inbox_url']);
            subscriptionMessage.sendActivity(
                rows[idx]['inbox_url'], Activity.parse(client.body));  // 単純フォーワード
            // subscriptionMessage.sendActivity(
            //     rows[idx]['inbox_url'], activity.announce(client.body));  // ブースト
          }

          return Promise.resolve(rows);
        });

      // 
      return Promise.resolve(account);
    })
    .catch(function(err) {
      console.log(err);
      return reject(err);
    });
};
