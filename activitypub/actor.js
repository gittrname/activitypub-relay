var uuid = require('node-uuid');

var Actor = function(url) {

  this.url = url;
};

Actor.prototype.myself = function(pubKey) {
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    'id':                this.url+'/actor',
    'type':              'Service',
    'preferredUsername': 'relay',
    'inbox':             this.url+'/inbox',

    'publicKey': {
      'id':           this.url+'/actor#main-key',
      'owner':        this.url+'/actor',
      'publicKeyPem': pubKey,
    }
  };
};

Actor.parse = function(body) {
  return JSON.parse(body);
};

module.exports = Actor;