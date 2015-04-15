'use strict';

var assert = require('assert');
var sinon = require('sinon');

var clientStub = {
  'get': sinon.stub(),
  'expire': sinon.stub(),
  'del': sinon.stub(),
  'set': sinon.stub()
};

var redisPlugin = require('../../../lib/cache-lib/redis')({'testingHarness': true}, clientStub);


clientStub.set.callsArg(2);
clientStub.expire.callsArg(2);
clientStub.get.callsArg(1);

describe('redis plugin', function(){

  afterEach(function(){
    clientStub.get.reset();
    clientStub.expire.reset();
    clientStub.del.reset();
    clientStub.set.reset();
  });

  it('should set a key with no TTL', function(done){
    redisPlugin.set('testkey', 'testvalue', function(){
      assert(clientStub.set.callCount === 1);
      done();
    });
  });

  it('should set a key with a TTL', function(done){
    redisPlugin.set('testkey', 'testvalue', 1, function(){
      assert(clientStub.set.callCount === 1);
      assert(clientStub.expire.callCount === 1);
      done();
    });
  });

  it('should get a key', function(done){
    redisPlugin.get('testkey', function(){
      assert(clientStub.get.callCount === 1);
      done();
    });
  });
});