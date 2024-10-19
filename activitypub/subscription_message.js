var url = require('url');
var fetch = require('node-fetch');

const packageJson = require("../package.json")

// 設定をロード
var config = require('../settings');

var Signature = require('../utils/signature_utilily');


var subscription_message = function(actor, privateKey) {

  this.keyId = actor+'#main-key';
  this.privateKey = privateKey;
};

subscription_message.prototype.sendActivity = async function(inboxUrl, activity) {

  // host
  var inboxUrl = url.parse(inboxUrl);

  // header,
  var headers = {
    'host': inboxUrl.host,
    'user-agent': 'Enjoy Relay '+packageJson.version,
    'content-type': 'application/activity+json',
    'date': (new Date()).toGMTString()
  };

  // digiest
  var rawBody = JSON.stringify(activity);
  headers['digest'] = Signature.digest(rawBody);

  // request
  var options = Signature.signRequest(
    this.keyId,
    this.privateKey,
    {
      method: 'POST',
      path: inboxUrl.path,
      timeout: config.queue.timeout,
      headers: headers,
      body: rawBody
    });

    return await fetch(inboxUrl.href, options)
      .then(function(res) {
        if (res.ok) {
          return res;
        } else {
          throw new Error((res.statusText)?res.statusText:"");
        }
      });
};

module.exports = subscription_message;
