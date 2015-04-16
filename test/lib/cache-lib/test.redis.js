'use strict';

var assert = require('assert');
var sinon = require('sinon');
var redis = require('redis');

var clientStub = {

  'get': sinon.stub().callsArg(1),
  'expire': sinon.stub().callsArg(2),
  'del': sinon.stub().callsArg(1),
  'set': sinon.stub().callsArg(2)
};

sinon.stub(redis, 'createClient', function(){
  return clientStub;
});

var redisPlugin = require('../../../lib/cache-lib/redis')({});

describe('redis plugin', function(){

  afterEach(function(){
    clientStub.get.reset();
    clientStub.expire.reset();
    clientStub.del.reset();
    clientStub.set.reset();
  });

  it('should call set a key with no TTL', function(done){
    redisPlugin.set('testkey', 'testvalue', function(){
      assert(clientStub.set.callCount === 1);
      done();
    });
  });

  it('should call set a key with a TTL', function(done){
    redisPlugin.set('testkey', 'testvalue', 1, function(){
      assert(clientStub.set.callCount === 1);
      assert(clientStub.expire.callCount === 1);
      done();
    });
  });

  it('should call get a key', function(done){
    redisPlugin.get('testkey', function(){
      assert(clientStub.get.callCount === 1);
      done();
    });
  });

  it('should call delete a key', function(done){
    redisPlugin.del('testkey', function(){
      assert(clientStub.del.callCount === 1);
      done();
    });
  });
});