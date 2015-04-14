'use strict';

var NodeCache = require('../lib/cache-lib/node-cache');
var redis = require('../lib/cache-lib/redis');
var MultiCache = require('..');
var assert = require('assert');
var debug = require('debug')('multi:test.multi');

describe('Multi Cache',function(){
  var localCache;
  var remoteCache;
  before(function(done){
    localCache = new NodeCache();
    remoteCache = redis;
    done();
  });

  it('should set/get an object in the local cache only', function(done){
    var options = {
      useLocalCache: true,
      useRemoteCache: false
    };
    var multiCache = new MultiCache(localCache, remoteCache, options);
    multiCache.set('myKey','myValue',function(err,result){
      assert(!err);
      assert(result);
      debug(result);
      multiCache.get('myKey',function(err,value){
        assert(!err);
        debug(value);
        assert.equal(value.myKey,'myValue');
        // TODO: Test that key/value is not in remoteCache
        done();
      });
    });
  });

  it.skip('should delete an object in the local cache only', function(done){
    var multiCache = new MultiCache({
      localCache: true,
      remoteCache: false
    });
    // Set a key/value in both local and remote caches
    // Set remoteCache to true to override the default from above
    multiCache.set('myKey','myValue', {remoteCache:true}, function(err,result){
      assert(!err);
      assert(result);
      debug(result);
      multiCache.del('myKey',function(err,value){
        assert(!err);
        debug(value);
        // TODO: Test that key/value is not in remoteCache
        done();
      });
    });
  });
});
