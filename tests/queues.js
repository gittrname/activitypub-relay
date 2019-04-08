var assert = require("chai").assert;
var nock = require('nock');

var followQueue = require('../queues/follow_queue');


describe('follow_queues', function() {
  it('#process', function() {

    nock("https://pub.example.com")
      //.matchHeader('accept', 'application/activity+json, application/ld+json')
      .get("/actor")
      .reply(200, {
        "id":"https://pub.example.com/actor",
        "endpoints": {
          "sharedInbox": "https://pub.example.com/inbox"
        },
        "publicKey": {
          "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyruyF9ZDU7FDw8Suzz4Y\nyqHU1iOoXq0LS6+7LurnqE/PVdhEJcGQQWnOrdBkjezewiPACami+l924DzFqJ8q\noWeWFlL5FYMzbz4ypsSHu+U8dN2PGEmmw9NnSC/AiDuA76leu3PjmcNgJRCLRZUe\nsIMrVh2VEHwSLh0rdhwCxY91ZMbHZqE1MyAeZrR8KUS/nctw/3dT9pFhEsC+yhz0\nUK57Ae+464I2gkSKE7tbsFt5DnOLZBg3/XSoqVBisCanNkbK05nsNtEpEsgFZ0LQ\nvNUKGWytTmGvPJnpa5Sca1n5bTdpfMWo7+J9HDoe4JGXwKUm4NchyIgXpbRFwFBJ\ndwIDAQAB\n-----END PUBLIC KEY-----\n"
        }
      }, {
        'Content-Type': 'application/json'
      })
      //.matchHeader('accept', 'application/activity+json')
      .post("/inbox")
      .reply(202);

    var data = JSON.stringify({
      "@context":"https://www.w3.org/ns/activitystreams",
      "id":"https://pub.example.com/2dab7e27-aaec-491c-b24f-82fe2cf9a5f5",
      "type":"Follow",
      "actor":"https://pub.example.com/actor",
      "object":"https://www.w3.org/ns/activitystreams#Public"
    });

    var job = {
      data: {
        client: {
          method: 'post',
          path: 'inbox',
          headers: {
            "content-type":"application/activity+json",
            "date":"Tue, 02 Apr 2019 18:14:03 GMT",
            "digest":"SHA-256=Re2AxS2pEXIEcu0wEfFHrJMJdS3z/GjJHDjXsh0aPK4=",
            "host":"pub.example.com",
            "signature":"keyId=\"https://pub.example.com/actor#main-key\",headers=\"(request-target) host date digest\",algorithm=\"rsa-sha256\",signature=\"KuNOL9wYpUBcGygV4uFP0WPMw2+vcxX7LlT5/Hon1MXWUKtLVLToDyfRsH4tJ4NvplgHvPgmY5x/ymEXJ8aN0IPltHjVwWfwBNVWWuis8v8vUgkeiQ+HfxGSp50jb8JfuHwrqO8VmhlizfP/g+diBSnLWDZhyTTmvWppQFvvieNzIOUjnchKIAVs9r/ZxLbeMUVaqmIZ08f7Clmf51rfByGf3mZK/kp+UhSqKNciDacFsG+phPcCLTuUr3l41shhZono31nsf0YLtW9bkLBw/t7b/uHThTbTUnGuwbQ+QV1Mul6SAdnDw31poET6UW9HTfHnDaVqEwX0FntPDf/t6w==\""
          },
          body: data
        }
      }
    };

    return followQueue(job)
      .then(function(v) {
        assert(v);
      });
  });
});