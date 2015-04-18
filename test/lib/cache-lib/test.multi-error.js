'use strict';

var assert = require('assert');
var MultiError = require('../../../lib/cache-lib/multi-error');

describe('Multi-Error',function(){

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

});
