var assert = require("chai").assert;
var crypto = require('crypto');

var Signature = require('../utils/signature_utilily');
var keyPair = require('../keypair/relay_keypair.json');

// 
// follow queue test.
describe('signature_utils', function() {
  it('#parseSignParams: invalid format.', function(done) {
    var req = {
      headers: {
        'signature': 'a,b'
      }
    };

    try {
      var params = Signature.parseSignParams(req);
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'param did not contain "=":a.');
    }

    done();
  });
  it('#parseSignParams: invalid key="value".', function(done) {
    var req = {
      headers: {
        'signature': 'a=aaaaaaaaaaaaaa,b=xxxxxxxxxxxxxx,c=zzzzzzzzzzzzzz'
      }
    };

    try {
      var params = Signature.parseSignParams(req);
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'malformed quoted-string in param.');
    }

    done();
  });
  it('#parseSignParams: success.', function(done) {
    var req = {
      headers: {
        'signature': 'a="aaaaaaaaaaaaaa",b="xxxxxxxxxxxxxx",c="zzzzzzzzzzzzzz"'
      }
    };

    var params = Signature.parseSignParams(req);

    assert.equal(params['a'], 'aaaaaaaaaaaaaa');
    assert.equal(params['b'], 'xxxxxxxxxxxxxx');
    assert.equal(params['c'], 'zzzzzzzzzzzzzz');

    done();
  });


  it('#signedStr: missing digest header.', function(done) {

    var req = {
      method: 'POST',
      path: '/',
      headers: {
        'a': 'aaaaaaaaaaaaaa',
        'b': 'xxxxxxxxxxxxxx',
        'c': 'zzzzzzzzzzzzzz'
      },
      body: "data"
    };

    try {
      var signHeader = "(request-target) digest a b";
      var signedStr = Signature.signedStr(signHeader,req);
      assert.fail();
    } catch(e) {
      assert.equal(e.message, 'unmatch header digest.');
    }

    done();
  });

  it('#signedStr: unmatch digest.', function(done) {

    var req = {
      method: 'POST',
      path: '/',
      headers: {
        'digest': 'dateakejfdkalfjdad',
        'a': 'aaaaaaaaaaaaaa',
        'b': 'xxxxxxxxxxxxxx',
        'c': 'zzzzzzzzzzzzzz'
      },
      body: "test"
    };

    try {
      var signHeader = "(request-target) digest a b";
      var signedStr = Signature.signedStr(signHeader,req);
      assert.fail();
    } catch(e) {
      assert.equal(e.message, 'unmatch header digest.');
    }
    
    done();
  });

  it('#signedStr: success1.', function(done) {

    var data = JSON.stringify({
      'test': 'aaaaaaaaaaaaaa'
    });

    var hash = crypto.createHash('sha256');
    hash.update(data);
    var digest = hash.digest('base64');


    var signHeader = "(request-target) digest a b";
    var req = {
      method: 'POST',
      path: '/path',
      headers: {
        'a': 'aaaaaaaaaaaaaa',
        'b': 'xxxxxxxxxxxxxx',
        'c': 'zzzzzzzzzzzzzz'
      },
      body: data
    };
    req.headers['digest'] = Signature.digest(data);

    var signedStr = Signature.signedStr(signHeader,req);
    assert.equal(signedStr, "(request-target): post /path\ndigest: SHA-256="+digest+"\na: aaaaaaaaaaaaaa\nb: xxxxxxxxxxxxxx");

    done();
  });

  it('my sign check.', function(done) {

    var data = JSON.stringify({
      'test': 'aaaaaaaaaaaaaa'
    });

    var keyId = "https://pub.example.com/actor";
    var req = {
      url: "https://relay.example.com",
      method: "POST",
      path: '/path',
      headers: {
        'host': 'pub.example.com',
        'date': (new Date()).toGMTString()
      },
      body: data
    };
    req.headers['digest'] = Signature.digest(data);

    var signReq = Signature.signRequest(keyId, keyPair.private, req);
    assert.isTrue(Signature.verifyRequest(keyPair.public, signReq));

    done();
  });
});