
var request = require("supertest")(require("../app"));
var expect = require("chai").expect;
var assert = require("chai").assert;

var Actor = require('../activitypub/actor');

var keyPair = require('../keypair/relay_keypair.json');
var config = require('../settings');

// 
// webfinger test.
describe('#get(/.well-known/webfinger?resource)', function() {
  it('query resource not found.', function(done) {
    request
      .get('/.well-known/webfinger')
      .expect(400, done);
  });
  it('query resource not present.', function(done) {
    request
      .get('/.well-known/webfinger')
      .query({resource: 'acct:relay@example.com'})
      .expect(404, done);
  });
  it('return status 200.', function(done) {
    request
      .get('/.well-known/webfinger')
      .query({resource: 'acct:'+config.relay.account})
      .expect(200, function(err, res) {

        var accountUri = 'acct:'+config.relay.account;
        assert(res.body, {
          'subject': accountUri,
          'links': [
            {
              'rel':  'self',
              'type': 'application/activity+json',
              'href': config.relay.url+'/actor'
            },
          ]
        });

        done();
      });
  });
});

// 
// actor test.
describe('#get(/actor)', function() {
  it('return status 200.', function(done) {
    request
      .get('/actor')
      .expect(200, function(err, res) {

        var actor = new Actor(config.relay.url);
        assert(res.body, actor.myself(config.relay.public));

        done();
      });
  });
});

// 
// inbox test.
describe('#get(/inbox)', function() {
  it('no content-type header.', function(done) {
    request
      .post('/inbox')
      .set('Signature', "test")
      .set('Digest', "test")
      .expect(400, done);
  });
  it('no signature header.', function(done) {
    request
      .post('/inbox')
      .set('Content-Type', "application/activity+json")
      .set('Digest', "test")
      .expect(400, done);
  });
  it('no digest header.', function(done) {
    request
      .post('/inbox')
      .set('Content-Type', "application/activity+json")
      .set('Signature', "test")
      .expect(400, done);
  });
  it('bad activity.', function(done) {
    request
      .post('/inbox')
      .set('Content-Type', "application/activity+json")
      .set('Digest', "test")
      .set('Signature', "test")
      .send('test')
      .expect(400, done);
  });
  it('undefined request type.', function(done) {
    request
      .post('/inbox')
      .set('Content-Type', "application/activity+json")
      .set('Digest', "test")
      .set('Signature', "test")
      .send({type: 'test'})
      .expect(400, done);
  });
  it('return status 200.', function(done) {
    request
      .post('/inbox')
      .set('Content-Type', "application/activity+json")
      .set('Digest', "test")
      .set('Signature', "test")
      .send({
        type: 'Follow',
        object: 'https://www.w3.org/ns/activitystreams#Public'
      })
      .expect(202, done);
  });
});