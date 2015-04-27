'use strict';


var createCache = require('./create-cache');
var async = require('async');
var _ = require('lodash');
var MultiError = require('./cache-lib/multi-error');

var MultiCache = (function(){
  function MultiCache(caches, options) {
    options = options || {};
    options.cacheOptions = options.cacheOptions || [];
    if(!_.isArray(caches)) {
      return new Error('caches must be an array');
    }
    if(!_.isArray(options.cacheOptions)) {
      return new Error('cacheOptions must be an array');
    }
    if(!options.disabled) {
      // Iterate through the number of caches and set the default
      // options for each cache if not explicitly set
      for(var i=0; i<caches.length; i++) {
        var opt = options.cacheOptions[i] = options.cacheOptions[i] || {};
        var props = ['useCache', 'TTL', 'cacheOptions'];
        var propDefaults = [true, undefined, undefined];
        // Iterate through the props and use the value set or the
        // value in the parent object or a hard coded default.
        for(var j=0; j<props.length; j++) {
          if(!opt.hasOwnProperty(props[j])){
            opt[props[j]] = options.hasOwnProperty(props[j]) ?
              options[props[j]] : propDefaults[j];
          }
        }
        caches[i] = typeof caches[i] === 'string' ?
          createCache(caches[i], opt.cacheOptions)
          : caches[i];
      }
    }
    this.options = options;
  }

  MultiCache.prototype.get = function(keys, options, callback) {
    var self = this;
    if(typeof options === 'function') {
      callback = options;
      options = null;
    }
    if(this.options.disabled) {
      return callback(new MultiError.KeyNotFoundError());
    }

    if(self._useLocalCache(options)) {
      self.localCache.get(keys, function(err, value){
        if(err && !err.keyNotFound) {
          return callback(err, value);
        }
        if(!_.isEmpty(value) || !self._useRemoteCache(options)) {
          return callback(err, value);
        }

        self.remoteCache.get(keys, function(err, value){
          if(err) {
            return callback(err, value);
          }
          if(options && options.setLocal && !_.isEmpty(value)) {
            self.localCache.set(keys, value, {localCache: true, remoteCache: false}, function(){
              return callback(err, value);
            });
          } else {
            return callback(err, value);
          }
        });

      });
    } else if(self._useRemoteCache(options)) {
      this.remoteCache.get(keys, callback);
    } else {
      return callback(new MultiError('local or remote must be specified when getting from cache'));
    }
  };

  MultiCache.prototype.set = function(key, value, ttl, options, callback) {
    if (arguments.length > 2) {
      ttl = options = callback = undefined;
      var args = [].slice.call(arguments);
      for (var i = 2; i < args.length; i++) {
        switch (typeof args[i]) {
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

    if(this.options.disabled) {
      if(callback) {
        return callback(null);
      } else {
        return undefined;
      }
    }

    return this._set(key, value, ttl, options, callback);
  };

  MultiCache.prototype._set = function(key, value, ttl, options, callback) {
    var setters = this._useMethods(options, 'set');

    if(setters.length === 0) {
      var err = new MultiError('local or remote must be specified when setting to cache');
      if(callback) {
        return callback(err);
      } else {
        throw err;
      }
    }
    async.each(setters, function(setter, cb){
      setter(key, value, ttl, cb);
    }, function(err){
      if(callback) {
        callback(err, value);
      }
    });
  };

  MultiCache.prototype.del = function(keys, options, callback) {
    if(typeof options === 'function') {
      callback = options;
      options = null;
    }
    if(this.options.disabled) {
      return callback();
    }
    var removers = this._useMethods(options, 'del');
    async.each(removers, function(remove, cb){
      remove(keys, cb);
    }, function(err){
      callback(err);
    });
  };

  MultiCache.prototype.flushAll = function(options, callback) {
    if(typeof options === 'function') {
      callback = options;
      options = null;
    }
    if(this.options.disabled) {
      return callback();
    }
    var flushers = this._useMethods(options, 'flushAll');
    async.each(flushers, function(flushall, cb){
      flushall(cb);
    }, function(err){
      callback(err);
    });
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

module.exports = MultiCache;
