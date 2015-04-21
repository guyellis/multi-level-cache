'use strict';

function MultiError(message) {
  var self = this;
  if(typeof message === 'string'){
    self.message = message;
  } else if (typeof message === 'object') {
    Object.keys(message).forEach(function(item){
      self[item] = message[item];
    });
  }
  self.name = 'MultiError';
  self.stack = (new Error()).stack;
  return self;
}
MultiError.prototype = new Error();

module.exports = MultiError;

// ## KeyNotFoundError

MultiError.KeyNotFoundError = function KeyNotFoundError (message) {
  if (!message) {
    message = 'Key not found in cache';
  }
  MultiError.call(this, message);
  this.keyNotFound = true;
  return this;
};

MultiError.KeyNotFoundError.prototype = new MultiError();

