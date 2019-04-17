var assert = require("chai").assert;
var nock = require('nock');

var Activity = require('../activitypub/activity');
var SubscriptionMessage = require('../activitypub/subscription_message');

var keyPair = require('../keypair/relay_keypair.json');

// 
// subscription_message
describe('subscription_message', function() {

  var activity = new Activity({
    url: "https://relay.example.com",
    actor: "https://relay.example.com/actor",
    account: 'acct:relay@/relay.example.com',
  });

  it('sendActivity', function() {

    var activityObj = activity.accept({
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id':     'https://relay.example.com/activities/000-000-00',
      'actor':  'https://relay.example.com/actor',
      'type':   'Follow',
      "object":"https://www.w3.org/ns/activitystreams#Public"
    });

    nock("https://pub.example.com")
      .post("/inbox", activityObj)
      .reply(202);

    var subscriptionMessage = new SubscriptionMessage({
      domain: 'relay.example.com',
      url: 'https://relay.example.com'
    }, keyPair.private);

    return subscriptionMessage
      .sendActivity('https://pub.example.com/inbox', activityObj)
      .then(function(res) {
        assert.equal(202, res.statusCode);
      })
  });
});