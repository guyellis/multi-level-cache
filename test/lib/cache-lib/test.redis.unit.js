'use strict';

var assert = require('assert');
//var sinon = require('sinon');
//var redis = require('redis');
var clientStub = require('../../../lib/helpers/redis-stubs').clientStub;
//var redisCreateClientStub = require('../../../lib/helpers/redis-stubs').redisCreateClientStub;


var redisPlugin = require('../../../lib/cache-lib/redis')({});

describe('redis plugin', function(){

  afterEach(function(){
    clientStub.get.reset();
    clientStub.expire.reset();
    clientStub.del.reset();
    clientStub.set.reset();
  });

  after(function(){
    //redisCreateClientStub.restore();
    //clientStub.get.restore();
    //clientStub.expire.restore();
    //clientStub.del.restore();
    //clientStub.set.restore();
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

  it('should call get a valid key', function(done){
    redisPlugin.get('testkey', function(){
      assert(clientStub.get.callCount === 1);
      done();
    });
  });

  it('should callback with undefined with an invalid key', function(done){
    clientStub.get.callsArgWith(1, null, null);
    redisPlugin.get('invalid_key_here', function(err, result){
      assert(clientStub.get.callCount === 1);
      //insure the stub is called properly on error and on result
      assert.equal(err, null);
      assert.equal(result, undefined);
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