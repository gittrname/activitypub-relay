var LruCache = require('lru-cache');

var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');

var database = require('../database');
var cache = require('../cache');

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

  console.log('start unfollow queue process. keyId='+signParams['keyId']);

  // リクエスト元の公開鍵取得
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
        .select('id')
        .where({url: account.url})
        .then(function(rows) {
  
          if (rows.length <= 0) {
            console.log('This relay is not follow. targetId='+signParams['keyId']);

            return Promise.resolve(rows);
          } else {
            console.log('This relay is remove follow. targetId='+signParams['keyId']);
            //
            // DB削除
            return database('accounts')
              .delete()
              .where({id: rows[0]['id']});
          }
        });

      //
      cache.del(signParams['keyId']);
        
      //
      // 承認リクエスト送付
      console.log('Send Accept Activity. targetId='+account['shared_inbox_url']);
      return subscriptionMessage.sendActivity(
        account['shared_inbox_url'], activity.accept(Activity.parse(client.body)));
    })
    .catch(function(err) {
      console.log(err.message);
    });
};
