var url = require('url');
var request = require('request');

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
      body: rawBody
    });
//  console.log(options);
  options['url'] = inboxUrl.href;


  return new Promise(function(resolve, reject) {
    request(options, function(err, res, data) {
      
      if (err) {
        console.log(err.message);
        return reject(err);
      }

      resolve(res);
    });
  });
};

module.exports = subscription_message;