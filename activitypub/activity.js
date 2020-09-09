var uuid = require('node-uuid');


//
// Activity Object
var Activity = function(relay) {
  this.relay = relay;
};

//
// Follow Activity Object
Activity.prototype.follow = function(actor) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.relay.url+'/activities/'+uuid.v4(),
    'actor':  this.relay.actor,
    'type':   'Follow',
    'object': actor
  };
};

//
// UnFollow Activity Object
Activity.prototype.unfollow = function(actor) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.relay.url+'/activities/'+uuid.v4(),
    'actor':  this.relay.actor,
    'type':   'Undo',
    'object': actor
  };
};

//
// Accept Activity Object
Activity.prototype.accept = function(activity) {
  if (typeof(activity) == 'string') {
    activity = Activity.parse(activity);
  }

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.relay.url+'/activities/'+uuid.v4(),
    'actor':  this.relay.actor,
    'type':   'Accept',
    'object': activity
  };
};

//
// Reject Activity Object
Activity.prototype.reject = function(keyId, activity) {
  if (typeof(activity) == 'string') {
    activity = Activity.parse(activity);
  }

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.relay.url+'/activities/'+uuid.v4(),
    'actor':  this.relay.actor,
    'type':   'Reject',
    'object': {
      'id':     this.relay.actor,
      'type':   activity.type,
      'actor':  keyId,
      'object': this.relay.actor
    }
  };
};

//
// Announce Activity Object
Activity.prototype.announce = function(activity) {
  if (typeof(activity) == 'string') {
    activity = Activity.parse(activity);
  }

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.relay.url+'/activities/'+uuid.v4(),
    'actor':  this.relay.actor,
    'type':   'Announce',
    'object': activity.object.id,
    'to':     [this.relay.actor+'/followers']
  };
};

//
// Parse Activtiy
Activity.parse = function(rawData) {
  if (typeof(rawData) == 'string') {
    return JSON.parse(rawData);
  } else {
    return rawData;
  }
};

module.exports = Activity;