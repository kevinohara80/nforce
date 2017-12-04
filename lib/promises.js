const P = require('bluebird');
const _ = require('lodash');

// add back in deferreds
const deferred = function() {
    var resolve, reject;
    const promise = new P(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
};

const createResolver = function(callback) {
    var defer;
    if (!callback || !_.isFunction(callback)) {
        defer = deferred();
    }
    return {
        resolve: function(data) {
            if (callback) callback(null, data);
            else if (defer) defer.resolve(data);
        },
        reject: function(err) {
            if (callback) callback(err);
            else if (defer) defer.reject(err);
        },
        promise: defer ? defer.promise : undefined
    };
};

module.exports.Promise = P;
module.exports.deferred = deferred;
module.exports.createResolver = createResolver;