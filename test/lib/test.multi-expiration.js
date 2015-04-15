'use strict';

var MultiCache = require('../..');
var assert = require('assert');
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

  it('should evict from cache based on TTL', function (done) {
    this.timeout(4000);
    var multiCache = new MultiCache('node-cache', 'node-cache', testBothActive);
    var ttl = 2; // seconds
    multiCache.set('myKey', 'myValue', ttl, function (err, result) {
      assert(!err);
      assert(!_.isEmpty(result));
      // Check that key is in both local and remote cache
      multiCache.get('myKey', testLocalOnly, function (err, value) {
        assert(!err);
        assert(!_.isEmpty(value));
        assert.equal(value.myKey, 'myValue');
        multiCache.get('myKey', testRemoteOnly, function (err, value) {
          assert(!err);
          assert(!_.isEmpty(value));
          assert.equal(value.myKey, 'myValue');
          // Test that key/value is evicted after 3 seconds
          setTimeout(function () {
            multiCache.get('myKey', testLocalOnly, function (err, value) {
              assert(!err);
              assert(_.isEmpty(value));
              multiCache.get('myKey', testRemoteOnly, function (err, value) {
                assert(!err);
                assert(_.isEmpty(value));
                done();
              });
            });
          }, 3000);
        });
      });
    });
  });

});
