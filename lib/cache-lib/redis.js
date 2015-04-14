'use strict';

var redis = require('redis');

module.exports = function(options, callback) {

  //deal with options
  options = options || {}
  //connect to redis
  var client = redis.createClient(options);

  //TODO: Error handling from the client connection process
  //client.on(err, function (){
  //  throw new Error('unable to do something')
  //});


  return {
    set: function (key, value, ttl, callback) {
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
          }
        }
      }
      client.setex(key, ttl || 0, value, callback)
    },
    get: function (keys, callback) {
      client.get(keys, callback)
    },
    del: function (keys, callback) {
      client.del(keys, callback)
    }
  };
};
