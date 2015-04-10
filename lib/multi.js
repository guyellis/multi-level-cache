'use strict';

var redis = require('redis');
var NodeCache = require('node-cache');
var MultiCache;

module.exports = MultiCache = (function(){

  function MultiCache(options) {
    this.options = options != null ? options : {};
    this.defaultLocalCache = options.localCache || true;
    this.defaultRemoteCache = options.remoteCache || true;
    this.localCache = new NodeCache(options);
    this.remoteCache = redis.createClient(options);
  }

  MultiCache.prototype.get = function(keys, options, callback) {
    if(typeof options === 'function') {
      callback = options;
    }
    return this.localCache.get(keys,callback);
  };

  MultiCache.prototype._useLocalCache = function(options) {
    if(options && options.hasOwnProperty('localCache')) {
      return options.localCache;
    }
    return this.defaultLocalCache;
  };

  MultiCache.prototype._useRemoteCache = function(options) {
    if(options && options.hasOwnProperty('remoteCache')) {
      return options.remoteCache;
    }
    return this.defaultRemoteCache;
  };

  MultiCache.prototype.set = function(key, value, ttl, options, callback) {
    if(arguments.length > 2) {
      var args = [].slice.call(arguments);
      for(var i=2; i<args.length; i++){
        switch(typeof args[i]){
          case 'number':
            ttl = args[i];
            break;
          case 'function':
            callback = args[i];
            break;
          case 'object':
            options = args[i];
        }
      }
    }

    if(this._useLocalCache(options)) {
      this.localCache.set(key, value, ttl, callback);
    }
  };

  MultiCache.prototype.del = function(keys, cb) {
  };

  MultiCache.prototype.ttl = function() {
  };

  MultiCache.prototype.keys = function(cb) {
  };

  MultiCache.prototype.getStats = function() {
    return this.stats;
  };

  MultiCache.prototype.flushAll = function(_startPeriod) {
  };

  return MultiCache;
})();

