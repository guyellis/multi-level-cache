'use strict';

var NodeCache = require('node-cache');

module.exports = function(options) {

  return new NodeCache(options);

};
