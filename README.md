# Multi Level Cache

Multi Level Cache allows you to manage a local and remote cache with a single API/module.

Install:

```
npm install multi-level-cache [--save]
```

Usage:

```
var MultiCache = require('multi-level-cache');
var multiCache = new MultiCache('node-cache', 'redis');

multiCache.set('myKey', 'myValue', function(err, result) {
  // Key/Value has been set in both the local in-memory node-cache
  // and in the remote redis cache
});

multiCache.get('myKey', function(err, result) {
  // value is now set to {myKey: 'myValue'}
  // By default it will look in local cache first and then remote
  // cache if not found locally.
});

