var uuid = require('node-uuid');

var Activity = function(url) {
  this.url = url;
};

Activity.prototype.accept = function(activity) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.url+'/activities/'+uuid.v4(),
    'actor':  this.url+'/actor',
    'type':   'Accept',
    'object': activity
  };
};

Activity.prototype.announce = function(activity) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.url+'/activities/'+uuid.v4(),
    'actor':  this.url+'/actor',
    'type':   'Announce',
    'object': activity.id,
    'to':     this.url+'/actor/followers',
  };
};

Activity.prototype.nested = function(activity) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.url+'/activities/'+uuid.v4(),
    'actor':  this.url+'/actor',
    'type':   activity.type,
    'object': activity.object,
    'to':     this.url+'/actor/followers',
  };
};

Activity.prototype.reject = function(actorId, type) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id':     this.url+'/actor/'+uuid.v4(),
    'type':   'Reject',
    'actor':  this.url+'/actor',
    'object': {
      'id':     this.url+'/actor',
      'type':   type,
      'actor':  actorId,
      'object': this.url+'/actor'
    }
  };
};

Activity.parse = function(body) {
  return JSON.parse(body);
};

module.exports = Activity;