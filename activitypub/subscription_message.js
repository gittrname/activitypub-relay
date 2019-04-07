var url = require('url');
var request = require('request');

var Signature = require('../utils/signature_utilily');


var subscription_message = function(url, privateKey) {

  this.keyId = url + '/actor';
  this.privateKey = privateKey;

  this.headers = {
    'content-type': 'application/activity+json',
    'date': (new Date()).toGMTString()
  };
};

subscription_message.prototype.sendActivity = function(inboxUrl, activity){

  // host
  var inboxUrl = url.parse(inboxUrl);
  this.headers['host'] = inboxUrl.host;

  // digiest
  var rawBody = JSON.stringify(activity);
  this.headers['digest'] = Signature.digest(rawBody);

  // リクエスト送付
  var options = Signature.signRequest(
    this.keyId,
    this.privateKey,
    {
      url: inboxUrl.href,
      path: inboxUrl.path,
      method: 'POST',
      headers: this.headers,
      body: rawBody
    });
  console.log(options);


  return new Promise(function(resolve, reject) {
    request(options, function(err, res, data) {
      if (err) {
        return reject(err);
      }

      resolve(res);
    });
  });
};

module.exports = subscription_message;