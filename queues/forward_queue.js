var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');

var database = require('../database');

var config = require('../settings');
var keyPair = require('../keypair/relay_keypair.json');

//
//
module.exports = function(job) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay, keyPair.private);
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
      //   console.log('Invalid signature. keyId='+signParams['keyId']);
  
      //   // 拒否応答
      //   return subscriptionMessage.sendActivity(
      //     account['shared_inbox_url'], activity.reject(signParams['keyId'], client.body));
      // }


      // 登録アカウント一覧取得
      return database('accounts')
        .select()
        .whereNot({url: account.url})
        .then(function(rows) {
          for(idx in rows) {
            // 転送
            console.log('Send Activity.'
              +' form='+account['uri']+' to='+rows[idx]['inbox_url']);
            subscriptionMessage.sendActivity(
                rows[idx]['inbox_url'], Activity.parse(client.body));  // 単純フォーワード
          }

          return Promise.resolve();
        });
    })
    .catch(function(err) {
      console.log(err);
      return reject(err);
    });
};
