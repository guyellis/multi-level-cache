'use strict';

var assert = require('assert');
var sinon = require('sinon');

// setup redis for testing w/o our framework
var redis = require('redis');

describe('redis adapter', function(){

  it('should call callback if redis returns an error in get', function(done) {
    var redisStub = sinon.stub(redis, 'createClient', function () {
      return {
        'get': function (key, callback) {
          return callback('fake error');
        }
      };
    });

    // This instance of the redis plugin will use our stubbed out redis.clientCreate
    // above to return an object with a get() that returns an error.
    var redisPlugin = require('../../../lib/cache-lib/redis')({});
    redisPlugin.get('testkey', function (err, value) {
      assert(err);
      assert.equal('fake error', err);
      assert.equal(undefined, value);
      redisStub.restore();
      done();
    });
  });


  it('should call set a key with no TTL', function(done){
    var clientStub = {
      'set': sinon.stub().callsArg(2)
    };
    var redisStub = sinon.stub(redis, 'createClient', function(){
      return clientStub;
    });

    var redisPlugin = require('../../../lib/cache-lib/redis')({});
    redisPlugin.set('testkey', 'testvalue', function(){
      assert.equal(clientStub.set.callCount, 1);
      redisStub.restore();
      done();
    });
  });

  it('should call set a key with a TTL', function(done){
    var clientStub = {
      'set': sinon.stub().callsArg(2),
      'expire': sinon.stub().callsArg(2)
    };
    var redisStub = sinon.stub(redis, 'createClient', function() {
      return clientStub;
    });

    var redisPlugin = require('../../../lib/cache-lib/redis')({});
    redisPlugin.set('testkey', 'testvalue', 15, function(){
      assert.equal(clientStub.set.callCount, 1);
      assert.equal(clientStub.expire.callCount, 1);
      redisStub.restore();
      done();
    });
  });

  it('should call get a valid key', function(done){
    var clientStub = {
      // the value returned from redis is pure JSON, needs to be literal here
      // increasing testing here to include parser revive function
      'get': sinon.stub().callsArgWith(1, null, '{"a":"2015-04-21T04:58:20.648Z","b":"something"}')
    };
    var redisStub = sinon.stub(redis, 'createClient', function() {
      return clientStub;
    });

    var redisPlugin = require('../../../lib/cache-lib/redis')({});
    redisPlugin.get('testkey', function(){
      assert.equal(clientStub.get.callCount, 1);
      redisStub.restore();
      done();
    });

  });

  it('should callback with KeyNotFoundError if there is no key', function(done){
    var clientStub = {
      'get': sinon.stub().callsArgWith(1, null, null)
    };
    var redisStub = sinon.stub(redis, 'createClient', function() {
      return clientStub;
    });

    var redisPlugin = require('../../../lib/cache-lib/redis')({});
    redisPlugin.get('this key is not in the cache', function(err, result){
      assert(err);
      assert.equal('MultiError', err.name);
      assert.equal(true, err.keyNotFound);
      assert.equal('Key not found in cache', err.message);
      assert.equal(result, undefined);
      assert.equal(clientStub.get.callCount, 1);
      redisStub.restore();
      done();
    });
  });

  it('should call delete a key', function(done){
    var clientStub = {
      'del': sinon.stub().callsArg(1)
    };
    var redisStub = sinon.stub(redis, 'createClient', function() {
      return clientStub;
    });

    var redisPlugin = require('../../../lib/cache-lib/redis')({});
    redisPlugin.del('testkey', function(){
      assert.equal(clientStub.del.callCount, 1);
      redisStub.restore();
      done();
    });


  });
});
