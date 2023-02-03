var crypto = require('crypto');

module.exports = {

  //
  // parse signature params
  parseSignParams: function (req) {

    if (!req.headers['signature']) {
      throw new Error('not found Signature header.');
    }

    var signParams = {};
    var params = req.headers['signature'].split(',');
    for(idx in params) {

      var pos = params[idx].indexOf('=');
      if (pos < 0) {
        throw new Error('param did not contain "=":'+params[idx]+'.');
      }

      var key = params[idx].slice(0, pos).trim();
      var value = params[idx].slice(pos+1, params[idx].length).trim();
      if (value.slice(0, 1) == '"'
        && value.slice(-1) == '"') {
        value = value.slice(1, value.length-1);
        if (value.length <= 0) {
          throw new Error('malformed quoted-string in param.');
        }
      } else {
        throw new Error('malformed quoted-string in param.');
      }

      signParams[key] = value;
    }

    return signParams;
  },

  //
  // make signed text
  signedStr: function(signHeader, req) {

    var signeds = [];

    var params = signHeader.split(' ');
    for(idx in params) {
      var name = params[idx];

      switch(name) {
        case '(request-target)':
          signeds.push('(request-target): '+req.method.toLowerCase()+' '+req.path);
          break;
        case 'digest':
          var dataDigest
          if (req.body) {
            dataDigest = this.digest(req.body);
          } else {
            dataDigest = this.digest(req.data);
          }
          if (!req.headers['digest'] || req.headers['digest'] != dataDigest) {
            throw new Error('unmatch header digest.');
          }
          signeds.push('digest: '+dataDigest);
          break;
        default:
          if (!req.headers[name]) {
            throw new Error('missing header in signature:'+name+'.');
          }
          signeds.push(name+': '+req.headers[name]);
          break;
      }
    }

    return signeds.join("\n");
  },

  //
  // make digest
  digest: function(rawData) {

    var hash = crypto.createHash('sha256');
    hash.update(rawData);

    return 'SHA-256='+hash.digest('base64');
  },

  //
  // sign verify
  verifyRequest: function(publicKey, req) {

    var params = this.parseSignParams(req);
    var signed = this.signedStr(params['headers'], req);
    //console.log(req);
    //console.log(signed);

    var verify = crypto.createVerify(params['algorithm'].toUpperCase());
    verify.update(signed);
    
    return verify.verify(publicKey, params['signature'], 'base64');
  },

  //
  // sign request
  signRequest: function(keyId, privateKey, req, signHeaders=['(request-target)','host','date','digest']) {

    var signedStr = this.signedStr(signHeaders.join(' '), req);

    var sign = crypto.createSign('RSA-SHA256');
    sign.update(signedStr);
    var signature = sign.sign(privateKey, 'base64');


    var signatures = new Array();
    signatures.push('keyId="'+keyId+'"');
    signatures.push('headers="'+signHeaders.join(' ')+'"');
    signatures.push('algorithm="rsa-sha256"');
    signatures.push('signature="'+signature+'"');

    req.headers['signature'] = signatures.join(',');

    return req;
  }
};