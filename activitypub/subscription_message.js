var url = require('url');
var axios = require('axios');

// 設定をロード
var config = require('../settings');

var Signature = require('../utils/signature_utilily');


var subscription_message = function(actor, privateKey) {

  this.keyId = actor+'#main-key';
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

  // request
  var options = Signature.signRequest(
    this.keyId,
    this.privateKey,
    {
      path: inboxUrl.path,
      method: 'POST',
      headers: this.headers,
      body: rawBody,
      data: rawBody
    });
//  console.log(options);
  options['url'] = inboxUrl.href;
  options['timeout'] = config.queue.timeout;

  return axios(options);
};

module.exports = subscription_message;