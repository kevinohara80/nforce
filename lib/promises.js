const _ = require('lodash');

var createResolver = function(callback) {
  if (callback && _.isFunction(callback)) {
    return {
      resolve: function (data) { callback(null, data); },
      reject: function (err) { callback(err); },
    };
  }

  var resolvePromise;
  var rejectPromise;
  var promise = new Promise(function (resolve, reject) {
    resolvePromise = resolve;
    rejectPromise  = reject;
  });

  return {
    resolve: resolvePromise,
    reject: rejectPromise,
    promise: promise,
  };
};

module.exports.createResolver = createResolver;
