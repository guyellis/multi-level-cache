'use strict';

var MultiCache;
var createCache = require('./create-cache');
var async = require('async');

module.exports = MultiCache = (function(){

  function MultiCache(localCache, remoteCache, options) {
    this.options = options != null ? options : {};
    this.useLocalCacheDefault = this.options.useLocalCache || true;
    this.useRemoteCacheDefault = this.options.useRemoteCache || true;
    this.localCache = typeof localCache === 'string' ? createCache(localCache, this.options.localOptions) : localCache;
    this.remoteCache = typeof remoteCache === 'string' ? createCache(remoteCache, this.options.remoteOptions) : remoteCache;
  }

  MultiCache.prototype.get = function(keys, options, callback) {
    if(typeof options === 'function') {
      callback = options;
      options = null;
    }

    if(this._useLocalCache(options)) {
      return this.localCache.get(keys, callback);
    } else if(this._useRemoteCache(options)) {
      this.remoteCache.get(keys, callback);
    } else {
      throw new Error('local or remote must be specified when getting from cache');
    }
  };

  MultiCache.prototype.set = function(key, value, ttl, options, callback) {
    if(arguments.length > 2) {
      ttl = options = callback = undefined;
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

    var setters = this._useMethods(options, 'set');

    async.each(setters, function(setter, cb){
      setter(key, value, ttl, cb);
    }, function(err){
      callback(err, value);
    });
  };

  MultiCache.prototype.del = function(keys, options, callback) {
    var removers = this._useMethods(options, 'del');
    async.each(removers, function(remove, cb){
      remove(keys, cb);
    }, function(err){
      callback(err);
    });
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

  MultiCache.prototype._useLocalCache = function(options) {
    if(options && options.hasOwnProperty('useLocalCache')) {
      return options.useLocalCache;
    }
    return this.useLocalCacheDefault;
  };

  MultiCache.prototype._useRemoteCache = function(options) {
    if(options && options.hasOwnProperty('useRemoteCache')) {
      return options.useRemoteCache;
    }
    return this.useRemoteCacheDefault;
  };

  // Get an array of methods to execute against the caches.
  // e.g. if we need to set both local and remote cache then
  // the options will let us know that both local and remote
  // need to be set and the method param will be set to 'set'
  MultiCache.prototype._useMethods = function(options, method) {
    var methods = [];
    if(this._useLocalCache(options)) {
      methods.push(this.localCache[method]);
    }
    if(this._useRemoteCache(options)) {
      methods.push(this.remoteCache[method]);
    }
    return methods;
  };

  return MultiCache;
})();

