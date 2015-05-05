'use strict';

var assert = require('assert');
var nodeCache = require('../../../lib/cache-lib/node-cache')();
var redis = require('../../../lib/cache-lib/redis')();

describe('Validate API', function(){

  it('should validate end points of APIs', function(done){
    var apis = [nodeCache, redis];
    var methods = ['get', 'set', 'del', 'flushAll', 'stats'];
    apis.forEach(function(api){
      methods.forEach(function(method){
        assert(api[method]);
        assert(typeof api[method] === 'function');
      });
    });
    done();
  });

});
