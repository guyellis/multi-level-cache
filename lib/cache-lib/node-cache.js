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
          return callback(new MultiError.KeyNotFoundError());
        }
        return callback(err, value);
      });
    },
    set: function set(key, val, ttl, callback) {
      return nodeCache.set(key, val, ttl, callback);
    },
    del: function del(key, callback) {
      return nodeCache.del(key, callback);
    },
    flushAll: function flushall(callback) {
      nodeCache.flushAll();
      callback();
    },
    stats: function stats(callback){
      nodeCache.keys(function(err, keys){
        if(err){
          return callback(new MultiError('Unable to retrieve keys from node-cache adapter'));
        }
        return callback(null, {
          "name": 'node-cache',
          "keys": keys.length,
          "custom": nodeCache.getStats()
        });
      });
    }
  };
};
