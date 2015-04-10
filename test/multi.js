'use strict';

var MultiCache = require('..');
var assert = require('assert');
var debug = require('debug')('multi:test.multi');

describe('Multi Cache',function(){
  it('should set an object in the local cache only', function(done){
    var multiCache = new MultiCache({
      localCache: true,
      remoteCache: false
    });
    multiCache.set('myKey','myValue',function(err,result){
      assert(!err);
      assert(result);
      debug(result);
      multiCache.get('myKey',function(err,value){
        assert(!err);
        debug(value);
        assert.equal(value.myKey,'myValue');
        done();
      });
    });
  });
});
