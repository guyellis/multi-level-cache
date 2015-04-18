'use strict';

var assert = require('assert');
var sinon = require('sinon');
var NodeCache = require('node-cache');

describe('node-cache adapter', function(){

  it('should call callback if node-cache returns an error', function(done){
    var nodeCacheStub = sinon.stub(NodeCache.prototype, 'get', function(key, callback){
      return callback('fake error');
    });

    var nodeCacheAdapter = require('../../../lib/cache-lib/node-cache')();
    nodeCacheAdapter.get('testkey', function(err, value){
      assert(err);
      assert.equal('fake error', err);
      assert.equal(undefined, value);
      nodeCacheStub.restore();
      done();
    });
  });
});
