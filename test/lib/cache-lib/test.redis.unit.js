'use strict';

var assert = require('assert');
var redisPlugin = require('../../../lib/cache-lib/redis')({});
var sinon = require('sinon');

// setup redis for testing w/o our framework
var redis = require('redis');
var redisClient = redis.createClient({});

describe('redis adapter', function(){

  afterEach(function(done){
    // remove the test keys each and every time from redis
    redisClient.del('testkey', function(/* err, results */){
      done();
    });
  });

  it('should call callback if redis returns an error in get', function(done){
    var redisStub = sinon.stub(redis, 'createClient', function() {
      return {
        get: function (key, callback) {
          return callback('fake error');
        }
      };
    });

    // This instance of the redis plugin will use our stubbed out redis.clientCreate
    // above to return an object with a get() that returns an error.
    var redisPlugin = require('../../../lib/cache-lib/redis')({});
    redisPlugin.get('testkey', function(err, value){
      assert(err);
      assert.equal('fake error', err);
      assert.equal(undefined, value);
      redisStub.restore();
      done();
    });
  });


  it('should call set a key with no TTL', function(done){
    redisPlugin.set('testkey', 'testvalue', function(){
      redisClient.get('testkey', function(err, result){
        assert.equal(err, null);
        assert.equal(result, 'testvalue');
        // no TTL on the key coming in from redis
        redisClient.ttl('testkey', function(err, result){
          assert.equal(err, null);
          assert.equal(result, -1);
          done();
        });
      });
    });
  });

  it('should call set a key with a TTL', function(done){
    redisPlugin.set('testkey', 'testvalue', 15, function(){
      redisClient.get('testkey', function(err, result){
        assert.equal(err, null);
        assert.equal(result, 'testvalue');
        // 15 second TTL on the key coming in from redis
        redisClient.ttl('testkey', function(err, result){
          assert.equal(err, null);
          assert.equal(result, 15);
          done();
        });
      });
    });
  });

  it('should call get a valid key', function(done){
    //setup
    redisClient.set('testkey', 'testvalue', function(err, result){
      assert.equal(err, null);
      assert.equal(result, 'OK');
      redisPlugin.get('testkey', function(err, result){
        assert.equal(err, null);
        assert.equal(result, 'testvalue');
        done();
      });
    });

  });

  it('should callback with KeyNotFoundError if there is no key', function(done){
    redisPlugin.get('this key is not in the cache', function(err, result){
      console.log(err, result);
      assert(err);
      assert.equal('MultiError', err.name);
      assert.equal(true, err.keyNotFound);
      assert.equal('Key not found in cache', err.message);
      assert.equal(result, undefined);
      done();
    });
  });

  it('should call delete a key', function(done){
    redisClient.set('testkey', 'testvalue', function(err, result){
      assert.equal(err, null);
      assert.equal(result, 'OK');
      redisPlugin.del('testkey', function(err, result){
        assert.equal(err, null);
        assert.equal(result, 1); // for 1 key deleted
        done();
      });
    });

  });
});
