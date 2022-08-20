var url = require('url');
var axios = require('axios');

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

  return axios(options)
    .then(function(res) {
      return res;
    })
    .catch(function(err) {
      console.log("request fail.["+options.url+"]");
      throw err;
    });
};

module.exports = subscription_message;