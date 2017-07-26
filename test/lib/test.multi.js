'use strict';

var nodeCache = require('../../lib/cache-lib/node-cache');
var MultiCache = require('../..');
var assert = require('assert');
var _ = require('lodash');
var sinon = require('sinon');
var redis = require('redis');
var async = require('async');

var integration = [
  ['node-cache', 'node-cache'],
  ['node-cache', 'redis'],
  ['redis', 'node-cache']
  // ['redis', 'redis'] - this test wouldn't make sense because
  // we're reading/writing from/to the same "namespace"
];

var unit = [['node-cache', 'node-cache']];

var isIntegrationTest = process.env.NODE_MULTICACHE_TESTTYPE === 'integration';

var tests = isIntegrationTest ? integration : unit;

// Some notes about why mockRedis() is needed
// The Redis client library will raise error events if it detects that redis is not
// available on the default (or specified) ports. These events will bubble up into
// the tests. It only happens in this test because we use setTimeout which allows
// node.js to call processNextTick() which bubbles the error events.
// We only want to do a full integration test when isIntegrationTest is true
function mockRedis() {
  if(!isIntegrationTest) {
    var connectionGoneStub, onErrorStub;
    before(function () {
      connectionGoneStub = sinon.stub(redis.RedisClient.prototype, 'connection_gone')
        .callsFake(function () {
          // do nothing
        });
      onErrorStub = sinon.stub(redis.RedisClient.prototype, 'on_error').callsFake(function () {
        // do nothing
      });
    });
    after(function () {
      connectionGoneStub.restore();
      onErrorStub.restore();
    });
  }
}

tests.forEach(function(test){
  var key = 'myKey';
  var localCacheName = test[0],
    remoteCacheName = test[1];
  describe('Multi Cache', function(){ // eslint-disable-line max-statements
    mockRedis();
    var testRemoteOnly,
      testLocalOnly,
      testBothActive,
      testBothInactive;
    before(function(){
      testRemoteOnly = {
        useLocalCache: false,
        useRemoteCache: true
      };
      testLocalOnly = {
        useLocalCache: true,
        useRemoteCache: false
      };
      testBothActive = {
        useLocalCache: true,
        useRemoteCache: true
      };
      testBothInactive = {
        useLocalCache: false,
        useRemoteCache: false
      };
    });

    describe('Class creation', function() {

      it('should create a Multi-Cache without options', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        assert.notEqual(multiCache.localCache, multiCache.remoteCache);
        assert(multiCache.useLocalCacheDefault);
        assert(multiCache.useRemoteCacheDefault);
        // TODO: Add sinon to confirm that the createCache function is called.
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(result);
          multiCache.get(key, function (err2, value) {
            assert(!err2);
            assert.equal(value, 'myValue');
            // Test that key/value is in remoteCache as well because if
            // we create the Multi Cache without options then both remote
            // and local are switched on by default.
            multiCache.get(key, testRemoteOnly, function (err3, value2) {
              assert(!err3);
              assert.equal(value2, 'myValue');
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
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, testLocalOnly, function (err2, value) {
            assert(!err2);
            assert.equal(value, 'myValue');
            multiCache.get(key, testRemoteOnly, function(err3, value2){
              assert(err3);
              assert(err3.keyNotFound);
              assert.equal(undefined, value2);
              done();
            });
          });
        });
      });


    });

    describe('Setting', function() {
      beforeEach(function(done){
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        multiCache.del(key, function(err){
          assert(!err);
          done();
        });
      });

      it('should set an object in the local cache only', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName, testLocalOnly);
        assert.notEqual(multiCache.localCache, multiCache.remoteCache);
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, function (err2, value) {
            assert(!err2);
            assert.equal(value, 'myValue');
            // Test that key/value is not in remoteCache
            multiCache.get(key, testRemoteOnly, function (err3, value2) {
              assert(err3);
              assert(err3.keyNotFound);
              assert.equal(undefined, value2);
              done();
            });
          });
        });
      });

      it('should set an object in the remote cache only', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName, testRemoteOnly);
        assert.notEqual(multiCache.localCache, multiCache.remoteCache);
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, testLocalOnly, function (err2, value) {
            assert(err2);
            assert(err2.keyNotFound);
            assert.equal(undefined, value);
            // Test that key/value is in remoteCache
            multiCache.get(key, testRemoteOnly, function (err3, value2) {
              assert(!err3);
              assert(!_.isEmpty(value2));
              done();
            });
          });
        });
      });

      it('should set an object in both remote and local caches', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
        assert.notEqual(multiCache.localCache, multiCache.remoteCache);
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, testLocalOnly, function (err2, value) {
            assert(!err2);
            assert(!_.isEmpty(value));
            // Test that key/value is in remoteCache
            multiCache.get(key, testRemoteOnly, function (err3, value2) {
              assert(!err3);
              assert(!_.isEmpty(value2));
              done();
            });
          });
        });
      });

      it('should return an error for neither caches during set', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothInactive);
        assert.notEqual(multiCache.localCache, multiCache.remoteCache);
        multiCache.set(key, 'myValue', function (err, result) {
          assert(err);
          assert(result === undefined);
          assert.equal('local or remote must be specified when setting to cache', err.message);
          done();
        });
      });

      it('should return an error for neither caches during get', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
        assert.notEqual(multiCache.localCache, multiCache.remoteCache);
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, testBothInactive, function (err2, value) {
            assert(typeof err2 === 'object');
            assert.equal(undefined, value);
            assert.equal('local or remote must be specified when getting from cache', err2.message);
            done();
          });
        });
      });

    });

    describe('Getting', function() {
      beforeEach(function(done){
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        multiCache.del(key, function(err){
          assert(!err);
          done();
        });
      });

      it('should get an object from the remote cache if local is empty', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        multiCache.set(key, 'myValue', testRemoteOnly, function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, function (err2, value) {
            assert(!err2);
            assert.equal(value, 'myValue');
            // Confirm that key is not in local cache
            multiCache.get(key, testLocalOnly, function (err3, value2) {
              assert(err3);
              assert(err3.keyNotFound);
              assert.equal(undefined, value2);
              done();
            });
          });
        });
      });

      it('should set an object in local cache if setLocal is true', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        multiCache.set(key, 'myValue', testRemoteOnly, function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, {setLocal: true}, function (err2, value) {
            assert(!err2);
            assert.equal(value, 'myValue');
            // Confirm that key is now also in local cache
            multiCache.get(key, testLocalOnly, function (err3, value2) {
              assert(!err3);
              assert(!_.isEmpty(value2));
              done();
            });
          });
        });
      });

      it('should handle the local cache returning an error on get', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
        var localStub = sinon.stub(multiCache.localCache, 'get').callsFake(function(keys, callback){
          return callback('fake error', 'fake value');
        });
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, function (err2, value) {
            assert.equal('fake error', err2);
            assert.equal('fake value', value);
            localStub.restore();
            done();
          });
        });
      });

      it('should handle the remote cache returning an error on get', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName, testBothActive);
        var remoteStub = sinon.stub(multiCache.remoteCache, 'get')
          .callsFake(function(keys, callback){
            return callback('fake error', 'fake value');
          });
        multiCache.set(key, 'myValue', testRemoteOnly, function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          multiCache.get(key, function (err2, value) {
            assert.equal('fake error', err2);
            assert.equal('fake value', value);
            remoteStub.restore();
            done();
          });
        });
      });

    });

    describe('Deleting', function() {

      it('should delete an object in the local cache only', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        // Set a key/value in both local and remote caches
        // Set remoteCache to true to override the default from above
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(result);
          multiCache.del(key, testLocalOnly, function (err2) {
            assert(!err2);
            // Check that key has been deleted from local cache but not
            // from remote cache
            multiCache.get(key, testLocalOnly, function (err3, value) {
              assert(err3);
              assert(err3.keyNotFound);
              assert.equal(undefined, value);
              multiCache.get(key, testRemoteOnly, function (err4, value2) {
                assert(!err4);
                assert.equal('myValue', value2);
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
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(result);
          multiCache.del(key, testRemoteOnly, function (err2) {
            assert(!err2);
            // Check that key has been deleted from local cache but not
            // from remote cache
            multiCache.get(key, testRemoteOnly, function (err3, value) {
              assert(err3);
              assert(err3.keyNotFound);
              assert.equal(undefined, value);
              multiCache.get(key, testLocalOnly, function (err4, value2) {
                assert(!err4);
                assert(!_.isEmpty(value2));
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
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(result);
          multiCache.del(key, function (err2) {
            assert(!err2);
            // Check that key has been deleted from both caches
            multiCache.get(key, testRemoteOnly, function (err3, value) {
              assert(err3);
              assert(err3.keyNotFound);
              assert.equal(undefined, value);
              multiCache.get(key, testLocalOnly, function (err4, value2) {
                assert(err4);
                assert(err4.keyNotFound);
                assert.equal(undefined, value2);
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
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(result);
          multiCache.del(key, testBothInactive, function (err2) {
            assert(!err2);
            // Check that key has been deleted from local cache but not
            // from remote cache
            multiCache.get(key, testRemoteOnly, function (err3, value) {
              assert(!err3);
              assert(!_.isEmpty(value));
              multiCache.get(key, testLocalOnly, function (err4, value2) {
                assert(!err4);
                assert(!_.isEmpty(value2));
                done();
              });
            });
          });
        });
      });
    });

    describe('Complex objects', function() {

      it('should set and get complex objects', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        var value = {
          nested: {
            obj: {
              which: {
                keeps: {
                  getting: {
                    deeper: {
                      and: {
                        deeper: {
                          and: {
                            has: {
                              an: {
                                array: {
                                  inside: {
                                    it: [
                                      1,
                                      1,
                                      2,
                                      6,
                                      24,
                                      {an: 'object'},
                                      'a string',
                                      new Date(),
                                      true,
                                      false
                                    ],
                                    and: {
                                      a: {
                                        date: new Date()
                                      }
                                    },
                                    a: {
                                      number: 1234
                                    },
                                    bool: true,
                                    string: 'another string'
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };
        // Test that the cache returns the same complex object as what was set
        multiCache.set(key, value, testBothActive, function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          // Confirm value from local cache
          multiCache.get(key, testLocalOnly, function (err2, result2) {
            assert(!err2);
            assert.deepEqual(result2, value);
            // Confirm value from remote cache
            multiCache.get(key, testRemoteOnly, function (err3, result3) {
              assert(!err3);
              assert.deepEqual(result3, value);
              done();
            });
          });
        });
      });
    });

    describe('Flush All', function() {
      function setBothAndConfirm(multiCache, key2, value, callback) {
        multiCache.set(key2, value, testBothActive, function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          // Confirm value from local cache
          multiCache.get(key2, testLocalOnly, function (err2, result2) {
            assert(!err2);
            assert(!_.isEmpty(result2));
            assert.equal(result2, value);
            // Confirm value from remote cache
            multiCache.get(key2, testRemoteOnly, function (err3, result3) {
              assert(!err3);
              assert(!_.isEmpty(result3));
              assert.equal(result3, value);
              callback();
            });
          });
        });
      }

      function confirmBothNoKey(multiCache, key2, callback) {
        multiCache.get(key2, testLocalOnly, function (err, value) {
          assert(err);
          assert(err.keyNotFound);
          assert(!value);
          // Confirm value from remote cache
          multiCache.get(key2, testRemoteOnly, function (err2, value2) {
            assert(err2);
            assert(err2.keyNotFound);
            assert(!value2);
            callback();
          });
        });
      }

      it('should flush all key/values from the cache', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        setBothAndConfirm(multiCache, key, 'myValue', function(){
          setBothAndConfirm(multiCache, 'myKey2', 'myValue2', function(){
            multiCache.flushAll(function(err){
              assert(!err);
              confirmBothNoKey(multiCache, key, function(){
                confirmBothNoKey(multiCache, 'myKey2', function(){
                  done();
                });
              });
            });
          });
        });
      });

      function confirmNoKeys(multiCache, keys, existLocation, notExistLocation, callback) {
        async.each(keys, function (key2, cb) {
          multiCache.get(key2, existLocation, function (err, value) {
            assert(!err);
            assert(value);
            multiCache.get(key2, notExistLocation, function (err2, value2) {
              assert(err2);
              assert(err2.keyNotFound);
              assert(!value2);
              cb();
            });
          });
        }, function(err){
          return callback(err);
        });
      }

      it('should flush all key/values from the local cache only', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        setBothAndConfirm(multiCache, key, 'myValue', function(){
          setBothAndConfirm(multiCache, 'myKey2', 'myValue2', function(){
            multiCache.flushAll(testLocalOnly, function(err){
              assert(!err);
              confirmNoKeys(multiCache, [key, 'myKey2'], testRemoteOnly, testLocalOnly,
                function(err2){
                  assert(!err2);
                  done();
                });
            });
          });
        });
      });

      it('should flush all key/values from the remote cache only', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        setBothAndConfirm(multiCache, key, 'myValue', function(){
          setBothAndConfirm(multiCache, 'myKey2', 'myValue2', function(){
            multiCache.flushAll(testRemoteOnly, function(err){
              assert(!err);
              confirmNoKeys(multiCache, [key, 'myKey2'], testLocalOnly, testRemoteOnly,
                function(err2){
                  assert(!err2);
                  done();
                });
            });
          });
        });
      });

    });

    describe('Cache Expiration', function(){
      it('should evict from cache based on TTL', function (done) {
        this.timeout(3000);
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        var ttl = 1; // seconds
        multiCache.set(key, 'myValue', ttl, function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          // Check that key is in both local and remote cache
          multiCache.get(key, testLocalOnly, function (err2, value) {
            assert(!err2);
            assert(!_.isEmpty(value));
            assert.equal(value, 'myValue');
            multiCache.get(key, testRemoteOnly, function (err3, value2) {
              assert(!err3);
              assert(!_.isEmpty(value2));
              assert.equal(value2, 'myValue');
              // Test that key/value is evicted after 3 seconds
              setTimeout(function () {
                multiCache.get(key, testLocalOnly, function (err4, value3) {
                  assert(err4);
                  assert(err4.keyNotFound);
                  assert.equal(undefined, value3);
                  multiCache.get(key, testRemoteOnly, function (err5, value4) {
                    assert(err5);
                    assert(err5.keyNotFound);
                    assert.equal(undefined, value4);
                    done();
                  });
                });
              }, 2000);
            });
          });
        });
      });

      it('should evict from cache based on TTL, ignoring default TTL', function (done) {
        this.timeout(3000);
        var multiCache = new MultiCache(localCacheName, remoteCacheName, {'ttl': 15});
        var ttl = 1; // seconds
        multiCache.set(key, 'myValue', ttl, function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          // Check that key is in both local and remote cache
          multiCache.get(key, testLocalOnly, function (err2, value) {
            assert(!err2);
            assert(!_.isEmpty(value));
            assert.equal(value, 'myValue');
            multiCache.get(key, testRemoteOnly, function (err3, value2) {
              assert(!err3);
              assert(!_.isEmpty(value2));
              assert.equal(value2, 'myValue');
              // Test that key/value is evicted after 3 seconds
              setTimeout(function () {
                multiCache.get(key, testLocalOnly, function (err4, value3) {
                  assert(err4);
                  assert(err4.keyNotFound);
                  assert.equal(undefined, value3);
                  multiCache.get(key, testRemoteOnly, function (err5, value4) {
                    assert(err5);
                    assert(err5.keyNotFound);
                    assert.equal(undefined, value4);
                    done();
                  });
                });
              }, 2000);
            });
          });
        });
      });

      it('should evict from cache based on the default TTL', function (done) {
        this.timeout(3000);
        var multiCache = new MultiCache(localCacheName, remoteCacheName, {'ttl': 1});
        multiCache.set(key, 'myValue', function (err, result) {
          assert(!err);
          assert(!_.isEmpty(result));
          // Check that key is in both local and remote cache
          multiCache.get(key, testLocalOnly, function (err2, value) {
            assert(!err2);
            assert(!_.isEmpty(value));
            assert.equal(value, 'myValue');
            multiCache.get(key, testRemoteOnly, function (err3, value2) {
              assert(!err3);
              assert(!_.isEmpty(value2));
              assert.equal(value2, 'myValue');
              // Test that key/value is evicted after 3 seconds
              setTimeout(function () {
                multiCache.get(key, testLocalOnly, function (err4, value3) {
                  assert(err4);
                  assert(err4.keyNotFound);
                  assert.equal(undefined, value3);
                  multiCache.get(key, testRemoteOnly, function (err5, value4) {
                    assert(err5);
                    assert(err5.keyNotFound);
                    assert.equal(undefined, value4);
                    done();
                  });
                });
              }, 2000);
            });
          });
        });
      });
    });

    describe('Stats', function(){
      beforeEach(function(done){
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        multiCache.flushAll(done);
      });

      it('should set keys in caches and get stats', function (done) {
        var multiCache = new MultiCache(localCacheName, remoteCacheName);
        var keyValues = [
          { key: 'key1', value: 'value1'},
          { key: 'key2', value: 'value2'},
          { key: 'key3', value: 'value3'}
        ];
        async.each(keyValues, function(keyValue, callback){
          multiCache.set(keyValue.key, keyValue.value, function (err, result) {
            assert(!err);
            assert(result);
            callback(err);
          });
        }, function(err){
          assert(!err);
          multiCache.stats(testLocalOnly, function(err2, stats){
            assert(!err2);
            assert(_.isArray(stats));
            assert.equal(1, stats.length);
            assert.equal(stats[0].name, localCacheName);
            assert.equal(stats[0].keys, 3);
            multiCache.stats(testRemoteOnly, function(err3, stats2){
              assert(!err3);
              assert(_.isArray(stats2));
              assert.equal(1, stats2.length);
              assert.equal(stats2[0].name, remoteCacheName);
              assert.equal(stats2[0].keys, 3);
              multiCache.stats(function(err4, stats3){
                assert(!err4);
                assert(_.isArray(stats3));
                assert.equal(2, stats3.length);
                assert.equal(stats3[0].name, localCacheName);
                assert.equal(stats3[1].name, remoteCacheName);
                assert.equal(stats3[0].keys, 3);
                assert.equal(stats3[1].keys, 3);
                done();
              });
            });
          });
        });
      });
    });
  });
});
