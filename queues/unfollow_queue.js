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

          // id リスト
          idList = [];
          for(var i in rows) {
            idList.push(rows[i]['id']);
          }

          //
          // DB削除
          return database('relays')
            .delete()
            .whereIn('id', idList);
        }
      });
  })
  .then(function(res) {

    // すでにFollowers登録されていないか確認
    return database('followers')
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

          // id リスト
          idList = [];
          for(var i in rows) {
            idList.push(rows[i]['id']);
          }

          //
          cache.del(signParams['keyId']);

          //
          // DB削除
          return database('followers')
            .delete()
            .whereIn('id', idList);
        }
      });
    })
    .then(function(res) {

      //
      // 承認リクエスト送付
      console.log('Send Accept Activity. targetId='+account['shared_inbox_url']);
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
