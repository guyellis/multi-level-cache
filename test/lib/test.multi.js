'use strict';

var nodeCache = require('../../lib/cache-lib/node-cache');
//var redis = require('../lib/cache-lib/redis');
var MultiCache = require('../..');
var assert = require('assert');
//var debug = require('debug')('multi:test.multi');
var _ = require('lodash');

describe('Multi Cache',function(){
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
      var multiCache = new MultiCache('node-cache', 'node-cache');
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
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
  });

  describe('Setting/Getting',function() {

    it('should set an object in the local cache only', function (done) {
      var localCache = nodeCache();
      var remoteCache = nodeCache();

      var multiCache = new MultiCache(localCache, remoteCache, testLocalOnly);
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

    it('should use cache names instead of objects to set locally', function (done) {
      var multiCache = new MultiCache('node-cache', 'node-cache', testLocalOnly);
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
      var multiCache = new MultiCache('node-cache', 'node-cache', testRemoteOnly);
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
      var multiCache = new MultiCache('node-cache', 'node-cache', testBothActive);
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

    it('should return an error for neither caches during set', function (done) {
      var multiCache = new MultiCache('node-cache', 'node-cache', testBothInactive);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(err);
        assert(_.isEmpty(result));
        done();
      });
    });

    it('should return an error for neither caches during get', function (done) {
      var multiCache = new MultiCache('node-cache', 'node-cache', testBothActive);
      assert.notEqual(multiCache.localCache, multiCache.remoteCache);
      multiCache.set('myKey', 'myValue', function (err, result) {
        assert(!err);
        assert(!_.isEmpty(result));
        multiCache.get('myKey', testBothInactive, function (err, value) {
          assert(typeof err === 'object');
          assert(_.isEmpty(value));
          done();
        });
      });
    });

  });

  describe('Getting',function() {

    it('should get an object from the remote cache if local is empty', function (done) {
      var multiCache = new MultiCache('node-cache', 'node-cache');
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

    it('should set an object in local cache', function (done) {
      var multiCache = new MultiCache('node-cache', 'node-cache');
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

  });

  describe('Deleting',function() {

    it('should delete an object in the local cache only', function (done) {
      var multiCache = new MultiCache('node-cache', 'node-cache');
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
      var multiCache = new MultiCache('node-cache', 'node-cache');
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
      var multiCache = new MultiCache('node-cache', 'node-cache');
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
      var multiCache = new MultiCache('node-cache', 'node-cache');
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
