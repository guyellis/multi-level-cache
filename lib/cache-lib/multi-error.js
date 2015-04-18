'use strict';

function MultiError(message) {
  var self = this;
  if(typeof message === 'string'){
    self.message = message;
  } else if (typeof message === 'object') {
    Object.keys(message).forEach(function(item){
      self[item] = message[item];
    });
    if(self.keyNotFound && !self.message) {
      self.message = 'Key not found in cache';
    }
  }
  self.name = 'MultiError';
  self.stack = (new Error()).stack;
}
MultiError.prototype = new Error();
MultiError.keyNotFound = new MultiError({keyNotFound: true});

module.exports = MultiError;
