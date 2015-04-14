'use strict';

var MultiCache;

module.exports = MultiCache = (function(){

  function MultiCache(localCache, remoteCache, options) {
    this.options = options != null ? options : {};
    this.useLocalCacheDefault = this.options.useLocalCache || true;
    this.useRemoteCacheDefault = this.options.useRemoteCache || true;
    this.localCache = localCache;
    this.remoteCache = remoteCache;
  }

  MultiCache.prototype.get = function(keys, options, callback) {
    if(typeof options === 'function') {
      callback = options;
      options = null;
    }
    // TODO: Insert logic to select between remote and local.
    // TODO: Add option to update local if getting from remote
    // This iteration only get from local
    return this.localCache.get(keys,callback);
  };

  MultiCache.prototype._useLocalCache = function(options) {
    if(options && options.hasOwnProperty('localCache')) {
      return options.localCache;
    }
    return this.useLocalCacheDefault;
  };

  MultiCache.prototype._useRemoteCache = function(options) {
    if(options && options.hasOwnProperty('remoteCache')) {
      return options.remoteCache;
    }
    return this.useRemoteCacheDefault;
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

  MultiCache.prototype.del = function(keys, callback) {
    if(this._useLocalCache(options)) {
      this.localCache.del(keys, callback);
    }
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

