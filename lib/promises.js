var P = require('bluebird');
var _ = require('lodash');

// add back in deferreds
var deferred = function() {
  var resolve, reject;
  var promise = new P(function() {
    resolve = arguments[0];
    reject = arguments[1];
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
};

var createResolver = function(callback) {
  var defer;
  if(!callback || !_.isFunction(callback)) {
    defer = deferred();
  }
  return {
    resolve: function(data) {
      if(callback) callback(null, data);
      else if(defer) defer.resolve(data);
    },
    reject: function(err) {
      if(callback) callback(err);
      else if(defer) defer.reject(err);
    },
    promise: (defer) ? defer.promise : undefined
  };
};

module.exports.Promise        = P;
module.exports.deferred       = deferred;
module.exports.createResolver = createResolver;
