var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');
var Signature = require('../utils/signature_utilily');

var accountCache = require('./account_cache');

var database = require('../database');
var cache = require('../cache');

var config = require('../settings');

//
//
module.exports = function(job, done) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
  var activity = new Activity(config.relay);
      
  // Signatation Params
  var client = job.data.client;
  var signParams = Signature.parseSignParams(client);

  console.log('start unfollow queue process. keyId='+signParams['keyId']);

  // リクエスト元の公開鍵取得
  accountCache(signParams['keyId'])
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
        .select('id')
        .where({
          account_id: account['id'],
          domain: account['domain']
        })
        .then(function(rows) {
  
          if (rows.length <= 0) {
            console.log('This relay is not follow. targetId='+signParams['keyId']);

            return Promise.resolve(rows);
          } else {
            console.log('This relay is remove follow. targetId='+signParams['keyId']);
            //
            // DB削除
            return database('relays')
              .delete()
              .where({
                'id': rows[0]['id']
              });
          }
        });

      //
      cache.del(signParams['keyId']);
        
      //
      // 承認リクエスト送付
      console.log('Send Accept Activity. targetId='+account['shared_inbox_url']);
      return subscriptionMessage.sendActivity(
         account['shared_inbox_url'], activity.accept(client.body));
    })
    .then(function(account) {
      // 処理終了
      done();
    })
    .catch(function(err) {
      console.log(err);
      done(err);
    });
};
