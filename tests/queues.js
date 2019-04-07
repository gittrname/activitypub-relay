var assert = require("chai").assert;
var nock = require('nock');

var followQueue = require('../queues/follow_queue');
var Signature = require('../utils/signature_utilily');


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
            "digest":Signature.digest(data),
            "host":"pub.example.com",
            "signature":"keyId=\"https://pub.example.com/actor#main-key\",algorithm=\"rsa-sha256\",headers=\"(request-target) host date digest content-type\",signature=\"EdEdOOxX+gXpWyWMDlNcU8K4T3zRdVW5dc74XVk16s3sTNHsVwRRecFGAd1Jojge/5zNNtA58QKhFvWhxcADNFPOhJVtGYyAVTIL42yKcreK6c6JvD6rhoTcvSgL0T/n86EvuMd+udjOs1Sgx8gSJDjuzjhCqGn3FmWV9PAcn1anfhxflTWyyysRoqERD5GIXrLyRQhU9Z5WN0c8hX/+z8UbCVo1jZqEmA4NmJbFmkUly2Buk8M5RzgvnRnZzZBkM3wBJSA748ba925GB9MbWnvlccWN/3Rb907gcPVGXSesIrUPzzqkKVCEmgFn9VzqN8+DDbRDvtbSpB+QqQMrkg==\""
          },
          body: data
        }
      }
    };
    return followQueue(job)
      .then(function() {
        assert.ok();
      })
      .catch(function(e) {
        assert.fail();
      });
  });
});