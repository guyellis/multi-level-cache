'use strict';

var NodeCache = require('node-cache');
var MultiError = require('./multi-error');

module.exports = function(options) {

  var nodeCache = new NodeCache(options);

  return {
    get: function get(key, callback) {
      return nodeCache.get(key, function(err, value){
        if(err) {
          return callback(err);
        }
        // node-cache indicates a "key not found" by returning
        // a value set to undefined
        if(value === undefined) {
          return callback(MultiError.keyNotFound);
        }
        return callback(err, value);
      });
    },
    set: function set(key, val, ttl, callback) {
      return nodeCache.set(key, val, ttl, callback);
    },
    del: function del(key, callback) {
      return nodeCache.del(key, callback);
    }
  };
};
