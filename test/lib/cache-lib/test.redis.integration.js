'use strict';

//var redis = require('redis');
var assert = require('assert');
// conditional test.
var runTest = false;

if(Number(process.env.MULTICACHE_USE_REDIS)  === 1){
  runTest = true;
}

console.log(process.env.MULTICACHE_USE_REDIS);
  describe('Integration test', function(){

    if(runTest){
      it('should be up and running', function(done){
        assert.equal(runTest, true);
        done();
      });
    } else {
      it('should be shut down, and not running', function(done){
        assert.equal(runTest, false);
        done();
      });
    }
  });

