'use strict';

var MultiCache = require('..');
var assert = require('assert');

describe('Multi Cache',function(){
  it('should set an object in the local cache only', function(done){
    var multiCache = new MultiCache({
      localCache: true,
      remoteCache: false
    });
    multiCache.set('myKey','myValue',function(err,result){
      done();
    });
  });
});
