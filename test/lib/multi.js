'use strict';

var nodeCache = require('../../lib/cache-lib/node-cache');
//var redis = require('../lib/cache-lib/redis');
var MultiCache = require('../..');
var assert = require('assert');
var debug = require('debug')('multi:test.multi');
var _ = require('lodash');

describe('Multi Cache',function(){
  var testRemoteOnly = {
    useLocalCache: false,
    useRemoteCache: true
  };
  var testLocalOnly = { // jshint ignore:line
    useLocalCache: true,
    useRemoteCache: false
  };
  var testBothActive = { // jshint ignore:line
    useLocalCache: true,
    useRemoteCache: true
  };
  var testBothInactive = { // jshint ignore:line
    useLocalCache: false,
    useRemoteCache: false
  };

  it('should set/get an object in the local cache only', function(done){
    var localCache = nodeCache();
    var remoteCache = nodeCache();
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

  it('should set/get an object in the local cache only using cache names instead of objects',
    function(done){
    var options = {
      useLocalCache: true,
      useRemoteCache: false
    };
    var multiCache = new MultiCache('node-cache', 'node-cache', options);
    assert.notEqual(multiCache.localCache, multiCache.remoteCache);
    multiCache.set('myKey','myValue',function(err,result){
      assert(!err);
      assert(result);
      multiCache.get('myKey',function(err,value){
        assert(!err);
        assert.equal(value.myKey,'myValue');
        // Test that key/value is not in remoteCache
        multiCache.get('myKey', testRemoteOnly, function(err,value){
          assert(!err);
          assert(_.isEmpty(value));
        });
        done();
      });
    });
  });

  it('should create a Multi-Cache without options', function(done){
    var multiCache = new MultiCache('node-cache', 'node-cache');
    assert.notEqual(multiCache.localCache, multiCache.remoteCache);
    multiCache.set('myKey','myValue',function(err,result){
      assert(!err);
      assert(result);
      multiCache.get('myKey',function(err,value){
        assert(!err);
        assert.equal(value.myKey,'myValue');
        // Test that key/value is in remoteCache as well because if
        // we create the Multi Cache without options then both remote
        // and local are switched on by default.
        multiCache.get('myKey', testRemoteOnly, function(err,value){
          assert(!err);
          assert.equal(value.myKey,'myValue');
        });
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
