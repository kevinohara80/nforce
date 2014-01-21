var _    = require('lodash');
var util = require('./util');

var Opts = function(args, conn) {
  var that = this;
  args = Array.prototype.slice.apply(args);
  var data = {};
  
  if(_.isFunction(_.last(args))) {
    this.callback = _.last(args);
  } else {
    this.callback = function() {};
  }

  if(_.isObject(args[0])) {
    data = args[0];
  } else {
    data = {};
  }

  Object.keys(data).forEach(function(key) {
    that[key] = data[key];
  });

  if(conn.mode === 'single' && !this.oauth) {
    this.oauth = conn.oauth;
  } 
}

Opts.prototype.getOAuth = function() {
  return this.data.oauth || {};
}

module.exports = Opts;