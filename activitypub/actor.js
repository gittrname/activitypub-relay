var uuid = require('node-uuid');

var Actor = function(relay) {

  this.relay = relay;
};


//
// Actor Object
Actor.prototype.myself = function(pubKey) {
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    'id':                this.relay.actor,
    'type':              'Service',
    'preferredUsername': 'relay',
    'inbox':             this.relay.url+'/inbox',

    'publicKey': {
      'id':           this.relay.actor+'#main-key',
      'owner':        this.relay.actor,
      'publicKeyPem': pubKey,
    }
  };
};

//
// Parse Actor
Actor.parse = function(body) {
  return JSON.parse(body);
};

module.exports = Actor;