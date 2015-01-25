var _        = require('lodash');
var promises = require('./promises');

var util = {};

util.isJsonResponse = function(res) {
  return res.headers &&
    res.headers['content-type'] &&
    res.headers['content-type'].split(';')[0].toLowerCase() === 'application/json';
};

util.isChunkedEncoding = function(res) {
  return res.headers &&
    res.headers['transfer-encoding'] &&
    res.headers['transfer-encoding'].toLowerCase() === 'chunked';
};

util.findId = function(data) {
  if(data.getId && _.isFunction(data.getId)) {
    return data.getId();
  } else if(data.Id) {
    return data.Id;
  } if(data.id) {
    return data.id;
  } else if(data.ID) {
    return data.ID;
  }
};

util.validateOAuth = function(oauth) {
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return false;
  } else {
    return true;
  }
};

util._ = _;

util.promises = promises;

module.exports = util;
