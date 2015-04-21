'use strict';

var createCache = require('../../lib/create-cache');
var assert = require('assert');

describe('Create Cache', function(){

  it('should be null if the cache type is not supported', function(done){
    var cache = createCache('this cache does not exist');
    assert.equal(null, cache);
    done();
  });

  it('should be a redis client if the cache type is redis', function(done){
    var cache = createCache('redis');
    assert(cache);
    assert(cache.get);
    assert(cache.set);
    assert(cache.del);
    done();
  });

  it('should be a node-cache module if the cache type is node-cache', function(done){
    var cache = createCache('node-cache');
    assert(cache);
    assert(cache.get);
    assert(cache.set);
    assert(cache.del);
    done();
  });


});
