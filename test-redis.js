var MultiCache = require('./index');
var redis = require('redis')
var options = {
  useLocalCache: false,
  useRemoteCache: true
};
var multiCache = new MultiCache('node-cache', 'redis', options);

multiCache.set('mykey', 'myvalue', function(err, result){
  console.log(err, result)
});
multiCache.get('mykey', redis.print)