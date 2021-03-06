var request = require('request');
var url = require('url');

var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');

var accountCache = require('./account_cache');

var database = require('../database');

var config = require('../settings');

//
//
module.exports = function(job) {

  //
  var subscriptionMessage = new SubscriptionMessage(config.relay.actor, config.relay.privateKey);
  var activity = new Activity(config.relay);
      
  // request
  var client = job.data.client;
  var json = JSON.parse(client.body);

  // webfinger url
  var account = json.account.split('@');
  var webfingerUrl = url.format({
    protocol: 'https',
    hostname: account[1],
    search: 'resource=acct:'+json.account,
    pathname: '.well-known/webfinger'
  });

  console.log('start remote_follow queue process. target='+json.account);

  // アカウントの存在確認
  return webfingerRequest(webfingerUrl)
    .then(function(obj) {

      // アカウントのURL取得
      var accountObj = selfObj(obj.links);
      return accountCache(accountObj.href)
        .then(function(account) {

          // すでにRelay登録されていないか確認
          database('followers')
            .select()
            .where({
              'account_id': account['id'],
              'domain': account['domain']
            })
            .then(function(rows) {
      
              if (rows.length > 0) {
                return database('followers')
                  .delete({
                    'id': rows[0]['id']
                  });
              }
            });
          
          //
          // アンフォローリクエスト送付
          console.log('Request Follow Activity. target='+account['shared_inbox_url']);
          subscriptionMessage.sendActivity(
              account['shared_inbox_url'], activity.unfollow(account['uri']));
        });
    })
    .catch(function(err) {
      console.log(err.message);
    });
};

//
//
var webfingerRequest = function(url) {

  var options = {
    url: url,
    method: 'GET',
    json: true
  };

  return new Promise(function(resolve, reject) {

    request(options, function(err, res, data) {

      if (err) {
        return reject(err);
      }

      resolve(data);
    });
  });
};

//
//
var selfObj = function(links) {

  for(idx in links) {
    var obj = links[idx];

    if (obj.rel == 'self') {
      return obj;
    }
  }

  throw new Error('not found self object.');
}