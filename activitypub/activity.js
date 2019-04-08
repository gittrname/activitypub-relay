var uuid = require('node-uuid');

module.exports = {

  //
  //
  accept: function(url, activity) {
    activity = this.parse(activity);

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id':     url+'/activities/'+uuid.v4(),
      'actor':  url+'/actor',
      'type':   'Accept',
      'object': activity
    };
  },
  //
  //
  reject: function(url, keyId, activity) {
    activity = this.parse(activity);

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id':     url+'/actor/'+uuid.v4(),
      'type':   'Reject',
      'actor':  url+'/actor',
      'object': {
        'id':     url+'/actor',
        'type':   activity.type,
        'actor':  keyId,
        'object': url+'/actor'
      }
    };
  },
  //
  //
  announce: function(url, activity) {
    activity = this.parse(activity);

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id':     url+'/activities/'+uuid.v4(),
      'actor':  url+'/actor',
      'type':   'Announce',
      'object': activity.object.id,
      'to':     [url+'/actor/followers']
    };
  },
  //
  //
  parse: function(rawData) {
    if (typeof(rawData) == 'string') {
      return JSON.parse(rawData);
    } else {
      return rawData;
    }
  }
};