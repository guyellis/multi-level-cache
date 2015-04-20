'use strict';

var assert = require('assert');
var MultiError = require('../../../lib/cache-lib/multi-error');

describe('Multi-Error', function(){

  it('inherits from Error', function () {
    assert(new MultiError() instanceof Error);
  });

  it('should create with params', function(done){
    var multiError = new MultiError();
    assert.equal('MultiError', multiError.name);
    assert(!multiError.keyNotFound);
    done();
  });

  it('should be able to customize the keyNotFound message', function(done){
    var customMessage = 'Custom message';
    var multiError = new MultiError({
      keyNotFound: true,
      message: customMessage
    });
    assert.equal('MultiError', multiError.name);
    assert.equal(true, multiError.keyNotFound);
    assert.equal(customMessage, multiError.message);
    done();
  });

  describe('KeyNotFoundError', function () {

    it('inherits from Error', function () {
      assert(new MultiError.KeyNotFoundError() instanceof Error);
    });

    it('inherits from MultiError', function () {
      assert(new MultiError.KeyNotFoundError() instanceof MultiError);
    });

    it('should create with default params', function () {
      var err = new MultiError.KeyNotFoundError();
      assert.equal('MultiError', err.name);
      assert.equal(true, err.keyNotFound);
      assert.equal('Key not found in cache', err.message);
    });

    it('should create with cusotm params', function () {
      var err = new MultiError.KeyNotFoundError('Key not found for special reason');
      assert.equal('MultiError', err.name);
      assert.equal(true, err.keyNotFound);
      assert.equal('Key not found for special reason', err.message);
    });
  });

});
