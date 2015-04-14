'use strict';

var redis = require('redis'); // jshint ignore:line

module.exports = function(options) { // jshint ignore:line


  //deal with options
  options = options || {};
  //connect to redis
  var client = redis.createClient(options);

  //TODO: Error handling from the client connection process
  client.on('error', function (){
    throw new Error('unable to do something')
  });


  return {
    set: function (key, value, ttl, callback) {
      if(typeof ttl === 'function'){
        callback = ttl;
        ttl = 0

      }
      console.log('setting: ', key, ' with value: ', value, ' ttl: ', ttl || 0);
      client.set(key, value, function(){
        if(ttl > 0){
          client.expire(key, ttl, callback);
        }
      })
    },
    get: function (keys, callback) {
      client.get(keys, callback)
    },
    del: function (keys, callback) {
      client.del(keys, callback)
    }
  };
};
