'use strict';

var redis = require('redis');
var MultiError = require('./multi-error');

module.exports = function(options) {
  //deal with options
  options = options || {};

  var client = redis.createClient(options);

  //TODO: Error handling from the client connection process
  //if(client){
  //  client.on('error', function (){
  //    //throw new Error('unable to do something');
  //  });
  //}

  return {
    set: function (key, value, ttl, callback) {
      if(typeof ttl === 'function'){
        callback = ttl;
        ttl = 0;
      }
      client.set(key, value, function(err, reply){
        if(ttl > 0){
          client.expire(key, ttl, callback);
        } else {
          callback(err, reply);
        }
      });
    },
    get: function (keys, callback) {
      client.get(keys, function(err, reply){
        if(err) {
          return callback(err);
        }
        //REDIS will return null for a missing key, we want the API
        // to return KeyNotFoundError
        if(reply === null){
          return callback(new MultiError.KeyNotFoundError());
        }
        return callback(err, reply);
      });
    },
    del: function (keys, callback) {
      client.del(keys, callback);
    }
  };
};
