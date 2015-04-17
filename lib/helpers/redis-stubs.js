'use strict';

var sinon = require('sinon');
var redis = require('redis');
var clientStub = {
  'get': sinon.stub().callsArg(1),
  'expire': sinon.stub().callsArg(2),
  'del': sinon.stub().callsArg(1),
  'set': sinon.stub().callsArg(2)
};

var redisCreateClientStub = sinon.stub(redis, 'createClient', function(){
  return clientStub;
});

exports.redisCreateClientStub = redisCreateClientStub;
exports.clientStub = clientStub;