'use strict';

var nodeCache = require('../../lib/cache-lib/node-cache');
var MultiCache = require('../..');
var assert = require('assert');
var _ = require('lodash');
var sinon = require('sinon');

describe('Multi Cache',function(){
  var localCacheName = 'node-cache';
  var remoteCacheName = 'node-cache';
  var testRemoteOnly = {
    useLocalCache: false,
    useRemoteCache: true
  };
  var testLocalOnly = {
    useLocalCache: true,
    useRemoteCache: false
  };
  var testBothActive = {
    useLocalCache: true,
    useRemoteCache: true
  };
  var testBothInactive = { 
    useLocalCache: false,
    useRemoteCache: false
  };

  describe('Class creation',function() {

    it('should create a Multi-Cache without options', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      assert(multiCache.useLocalCacheDefault);
      assert(multiCache.useRemoteCacheDefault);
      // TODO: Add sinon to confirm that the createCache function is called.
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(result);
        multiCache.get('myKey', function (err, value) {
          assert(!err);
          assert.equal(value.myKey, 'myValue');
          // Test that key/value is in remoteCache as well because if
          // we create the Multi Cache without options then both remote
          // and local are switched on by default.
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert.equal(value.myKey, 'myValue');
            done();
          });
        });
      });
    });

    it('should create a Multi-Cache with pre-created caches', function (done) {
      // Pass in pre-created cache objects to create a Multi-Cache instead of
      // names for the cache objects.
      var localCache = nodeCache();
      var remoteCache = nodeCache();

      var multiCache = new MultiCache(localCache, remoteCache, testLocalOnly);
      // TODO: Add sinon to confirm that the createCache function is NOT called.
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', testLocalOnly, function (err, value) {
          assert(!err);
          assert.equal(value.myKey, 'myValue');
          multiCache.get('myKey', testRemoteOnly, function(err, value){
            assert(!err);
            assert(_.isEmpty(value));
            done();
          });
        });
      });
    });


  });

  describe('Setting',function() {

    it('should set an object in the local cache only', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testLocalOnly);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', function (err, value) {
          assert(!err);
          assert.equal(value.myKey, 'myValue');
          // Test that key/value is not in remoteCache
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert(_.isEmpty(value));
            done();
          });
        });
      });
    });

    it('should set an object in the remote cache only', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testRemoteOnly);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', testLocalOnly, function (err, value) {
          assert(!err);
          assert(_.isEmpty(value));
          // Test that key/value is in remoteCache
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert(!_.isEmpty(value));
            done();
          });
        });
      });
    });

    it('should set an object in both remote and local caches', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', testLocalOnly, function (err, value) {
          assert(!err);
          assert(!_.isEmpty(value));
          // Test that key/value is in remoteCache
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert(!_.isEmpty(value));
            done();
          });
        });
      });
    });

    it('should set with two params on set()', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
      multiCache.set('myKey', 'myValue');
      // .set() is async so wait for 500ms before testing that the value
      // has been set. We're doing this test to check the "else" branch
      // in the target code.
      setTimeout(function() {
        multiCache.get('myKey', testLocalOnly, function (err, value) {
          assert(!err);
          assert(!_.isEmpty(value));
          assert.equal(value.myKey, 'myValue');
          // Test that key/value is in remoteCache
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert(!_.isEmpty(value));
            assert.equal(value.myKey, 'myValue');
            done();
          });
        });
      }, 500);
    });

    it('should throw with no callback and no caches on set()', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothInactive);
      try {
        multiCache.set('myKey', 'myValue');
      } catch(e) {
        assert.equal('local or remote must be specified when setting to cache', e.message);
        done();
      }
    });

    it('should return an error for neither caches during set', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothInactive);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(err);
        assert(_.isEmpty(result));
        assert.equal('local or remote must be specified when setting to cache', err.message);
        done();
      });
    });

    it('should return an error for neither caches during get', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', testBothInactive, function (err, value) {
          assert(typeof err === 'object');
          assert(_.isEmpty(value));
          assert.equal('local or remote must be specified when getting from cache', err.message);
          done();
        });
      });
    });

  });

  describe('Getting',function() {

    it('should get an object from the remote cache if local is empty', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName);
      multiCache.set('myKey', 'myValue', testRemoteOnly, function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', function (err, value) {
          assert(!err);
          assert.equal(value.myKey, 'myValue');
          // Confirm that key is not in local cache
          multiCache.get('myKey', testLocalOnly, function (err, value) {
            assert(!err);
            assert(_.isEmpty(value));
            done();
          });
        });
      });
    });

    it('should set an object in local cache if setLocal is true', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName);
      multiCache.set('myKey', 'myValue', testRemoteOnly, function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', {setLocal: true}, function (err, value) {
          assert(!err);
          assert.equal(value.myKey, 'myValue');
          // Confirm that key is now also in local cache
          multiCache.get('myKey', testLocalOnly, function (err, value) {
            assert(!err);
            assert(!_.isEmpty(value));
            done();
          });
        });
      });
    });

    it('should handle the local cache returning an error on get', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
      var localStub = sinon.stub(multiCache.localCache, 'get', function(keys, callback){
        return callback('fake error', 'fake value');
      });
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', function (err, value) {
          assert.equal('fake error', err);
          assert.equal('fake value', value);
          localStub.restore();
          done();
        });
      });
    });

    it('should handle the remote cache returning an error on get', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
      var remoteStub = sinon.stub(multiCache.remoteCache, 'get', function(keys, callback){
        return callback('fake error', 'fake value');
      });
      multiCache.set('myKey', 'myValue', testRemoteOnly, function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', function (err, value) {
          assert.equal('fake error', err);
          assert.equal('fake value', value);
          remoteStub.restore();
          done();
        });
      });
    });

  });

  describe('Deleting',function() {

    it('should delete an object in the local cache only', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName);
      // Set a key/value in both local and remote caches
      // Set remoteCache to true to override the default from above
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(result);
        multiCache.del('myKey', testLocalOnly, function (err) {
          assert(!err);
          // Check that key has been deleted from local cache but not
          // from remote cache
          multiCache.get('myKey', testLocalOnly, function (err, value) {
            assert(!err);
            assert(_.isEmpty(value));
            multiCache.get('myKey', testRemoteOnly, function (err, value) {
              assert(!err);
              assert(!_.isEmpty(value));
              done();
            });
          });
        });
      });
    });

    it('should delete an object in the remote cache only', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName);
      // Set a key/value in both local and remote caches
      // Set remoteCache to true to override the default from above
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(result);
        multiCache.del('myKey', testRemoteOnly, function (err) {
          assert(!err);
          // Check that key has been deleted from local cache but not
          // from remote cache
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert(_.isEmpty(value));
            multiCache.get('myKey', testLocalOnly, function (err, value) {
              assert(!err);
              assert(!_.isEmpty(value));
              done();
            });
          });
        });
      });
    });

    it('should delete an object in both remote and local caches', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName);
      // Set a key/value in both local and remote caches
      // Set remoteCache to true to override the default from above
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(result);
        multiCache.del('myKey', testBothActive, function (err) {
          assert(!err);
          // Check that key has been deleted from local cache but not
          // from remote cache
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert(_.isEmpty(value));
            multiCache.get('myKey', testLocalOnly, function (err, value) {
              assert(!err);
              assert(_.isEmpty(value));
              done();
            });
          });
        });
      });
    });

    it('should not delete an object in either remote and local caches', function (done) {
      var multiCache = new MultiCache(localCacheName, remoteCacheName);
      // Set a key/value in both local and remote caches
      // Set remoteCache to true to override the default from above
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(result);
        multiCache.del('myKey', testBothInactive, function (err) {
          assert(!err);
          // Check that key has been deleted from local cache but not
          // from remote cache
          multiCache.get('myKey', testRemoteOnly, function (err, value) {
            assert(!err);
            assert(!_.isEmpty(value));
            multiCache.get('myKey', testLocalOnly, function (err, value) {
              assert(!err);
              assert(!_.isEmpty(value));
              done();
            });
          });
        });
      });
    });
  });

});
