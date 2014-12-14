// module dependencies

var request     = require('request');
var promises    = require('./lib/promises');
var qs          = require('querystring');
var url         = require('url');
var Record      = require('./lib/record');
var QueryStream = require('./lib/querystream');
var FDCStream   = require('./lib/fdcstream');
var util        = require('./lib/util');
var errors      = require('./lib/errors');
var multipart   = require('./lib/multipart');
var faye        = require('faye');
var mime        = require('mime');
var zlib        = require('zlib');
var _           = require('lodash');

// constants

var AUTH_ENDPOINT      = 'https://login.salesforce.com/services/oauth2/authorize';
var TEST_AUTH_ENDPOINT = 'https://test.salesforce.com/services/oauth2/authorize';
var LOGIN_URI          = 'https://login.salesforce.com/services/oauth2/token';
var TEST_LOGIN_URI     = 'https://test.salesforce.com/services/oauth2/token';
var ENVS               = ['sandbox', 'production'];
var MODES              = ['multi', 'single'];

var API_VERSIONS  = [
  'v20.0', 'v21.0', 'v22.0', 'v23.0', 'v24.0',
  'v25.0', 'v26.0', 'v27.0', 'v28.0', 'v29.0',
  'v30.0', 'v31.0', 'v32.0'
];

var plugins = {};

// nforce connection object

var Connection = function(opts) {
  var self = this;

  opts = _.defaults(opts || {}, {
    clientId:      null,
    clientSecret:  null,
    redirectUri:   null,
    loginUri:      LOGIN_URI,
    testLoginUri:  TEST_LOGIN_URI,
    apiVersion:    _.last(API_VERSIONS),
    environment:   'production',
    mode:          'multi',
    gzip:          false,
    autoRefresh:   false,
    onRefresh:     undefined,
    timeout:       undefined
  });

  // convert option values

  opts.apiVersion = opts.apiVersion.toString().toLowerCase().replace('v', '').replace('.0', '');
  opts.environment = opts.environment.toLowerCase();
  opts.mode = opts.mode.toLowerCase();

  self = _.assign(this, opts);

  // validate options

  if(!_.isString(this.clientId)) throw new Error('invalid or missing clientId');
  if(!_.isString(this.redirectUri)) throw new Error('invalid or missing redirectUri');
  if(!_.isString(this.loginUri)) throw new Error('invalid or missing loginUri');
  if(!_.isString(this.testLoginUri)) throw new Error('invalid or missing testLoginUri');
  if(!_.isBoolean(this.gzip)) throw new Error('gzip must be a boolean');
  if(!_.isString(this.environment) || _.indexOf(ENVS, this.environment) === -1) {
    throw new Error('invalid environment, only ' + ENVS.join(' and ') + ' are allowed');
  }
  if(!_.isString(this.mode) || _.indexOf(MODES, this.mode) === -1) {
    throw new Error('invalid mode, only ' + MODES.join(' and ') + ' are allowed');
  }
  if(this.onRefresh && !_.isFunction(this.onRefresh)) throw new Error('onRefresh must be a function');
  if(this.timeout && !_.isNumber(this.timeout)) throw new Error('timeout must be a number');

  // parse api version

  try {
    this.apiVersion = 'v' + parseInt(this.apiVersion, 10) + '.0';
  } catch (err) {
    throw new Error('invalid apiVersion number');
  }
  if(API_VERSIONS.indexOf(this.apiVersion) === -1) {
    throw new Error('api version ' + this.apiVersion + ' is not supported');
  }

  // parse timeout into integer in case it's a floating point.

  this.timeout = parseInt(this.timeout, 10);

  // load plugins

  if(opts.plugins && _.isArray(opts.plugins)) {
    opts.plugins.forEach(function(pname) {
      if(!plugins[pname]) throw new Error('plugin ' + pname + ' not found');
      // clone the object
      self[pname] = _.clone(plugins[pname]._fns);

      // now bind to the connection object
      _.forOwn(self[pname], function(fn, key) {
        self[pname][key] = _.bind(self[pname][key], self);
      });

    });
  }

};

// argument parsing

Connection.prototype._getOpts = function(d, c) {
  var data, callback;
  if(_.isFunction(c)) {
    callback = c;
    data = d;
  } else if(_.isFunction(d)) {
    callback = d;
    data = {};
  } else {
    data = d || {};
  }
  data.callback = callback;
  if(this.mode === 'single' && !data.oauth) {
    data.oauth = this.oauth;
  }
  return data;
};

// authentication methods

Connection.prototype.getAuthUri = function(opts) {
  if(!opts) opts = {};
  var urlOpts;
  var self = this;
  urlOpts = {
    'response_type': opts.responseType || 'code',
    'client_id': self.clientId,
    'redirect_uri': self.redirectUri
  };
  if(opts.display) {
    urlOpts.display = opts.display.toLowerCase();
  }
  if(opts.immediate) {
    urlOpts.immediate = opts.immediate;
  }
  if(opts.scope) {
    if(typeof opts.scope === 'object') {
      urlOpts.scope = opts.scope.join(' ');
    }
  }
  if(opts.state) {
    urlOpts.state = opts.state;
  }
  if(self.environment == 'sandbox') {
    return TEST_AUTH_ENDPOINT + '?' + qs.stringify(urlOpts);
  } else {
    return AUTH_ENDPOINT + '?' + qs.stringify(urlOpts);
  }
};

Connection.prototype.authenticate = function(data, callback) {
  var self = this;
  var opts = this._getOpts(data, callback);
  opts.uri = (self.environment == 'sandbox') ? this.testLoginUri : this.loginUri;
  opts.method = 'POST';
  opts.headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  var bopts = {
    client_id: self.clientId,
    client_secret: self.clientSecret
  };
  if(opts.code) {
    bopts.grant_type = 'authorization_code';
    bopts.code = opts.code;
    bopts.redirect_uri = self.redirectUri;
  } else if(opts.username && opts.password) {
    bopts.grant_type = 'password';
    bopts.username = opts.username;
    bopts.password = opts.password;
    if(opts.securityToken) {
      bopts.password = bopts.password + opts.securityToken;
    }
  }
  opts.body = qs.stringify(bopts);
  return this._apiAuthRequest(opts, opts.callback);
};

Connection.prototype.refreshToken = function(data, callback) {
  var self = this;
  var opts = _.defaults(this._getOpts(data, callback), {
    executeOnRefresh: false
  });
  var resolver = promises.createResolver(opts.callback);

  opts.uri = (this.environment == 'sandbox') ? this.testLoginUri : this.loginUri;
  opts.method = 'POST';

  var refreshOpts = {
    'client_id': this.clientId,
    'grant_type': 'refresh_token',
    'redirect_uri': this.redirectUri,
    'refresh_token': opts.oauth.refresh_token
  };

  // check for clientSecret and include if found
  if(this.clientSecret) {
    refreshOpts.client_secret = this.clientSecret;
  }

  opts.body = qs.stringify(refreshOpts);
  opts.headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  this._apiAuthRequest(opts, function(err, res) {
    if(err) return resolver.reject(err);
    var old = _.clone(opts.oauth);
    _.assign(opts.oauth, res);
    if(self.onRefresh && opts.executeOnRefresh === true) {
      self.onRefresh.call(self, opts.oauth, old, function(err3){
        if(err3) return resolver.reject(err3);
        else return resolver.resolve(opts.oauth);
      });
    } else {
      resolver.resolve(opts.oauth);
    }
  });

  return resolver.promise;
};

Connection.prototype.revokeToken = function(data, callback) {
  var opts = this._getOpts(data, callback);
  if(this.environment === 'sandbox') {
    opts.uri = 'https://test.salesforce.com/services/oauth2/revoke';
  } else {
    opts.uri = 'https://login.salesforce.com/services/oauth2/revoke';
  }
  opts.uri += '?token=' + opts.token;
  if(opts.callbackParam) {
    opts.uri += '&callback=' + opts.callbackParam;
  }
  return this._apiAuthRequest(opts, opts.callback);
};

Connection.prototype.getPasswordStatus = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? opts.sobject.getId() : opts.id;
  opts.resource = '/sobjects/user/' + id + '/password';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.updatePassword = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? opts.sobject.getId() : opts.id;
  opts.resource = '/sobjects/user/' + id + '/password';
  opts.method = 'POST';
  opts.body = JSON.stringify({ newPassword: opts.newPassword });
  return this._apiRequest(opts, opts.callback);
};

// api methods

Connection.prototype.getIdentity = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.uri = opts.oauth.id;
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getVersions = function(callback) {
  var opts = this._getOpts({}, callback);
  opts.uri = 'http://na1.salesforce.com/services/data/';
  opts.method = 'GET';
  return this._apiAuthRequest(opts, callback);
};

Connection.prototype.getResources = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.resource = '/';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getSObjects = function(data, callback) {
  var self = this;
  var opts = this._getOpts(data, callback);
  opts.resource = '/sobjects';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getMetadata = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.resource = '/sobjects/' + opts.type;
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getDescribe = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.resource = '/sobjects/' + opts.type + '/describe';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.insert = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var type = opts.sobject.getType();
  opts.resource = '/sobjects/' + type;
  opts.method = 'POST';
  if(type === 'document' || type === 'attachment' || type === 'contentversion') {
    opts.multipart = multipart(opts);
  } else {
    opts.body = JSON.stringify(opts.sobject._getPayload(false));
  }
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.update = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var type = opts.sobject.getType();
  var id = opts.sobject.getId();
  opts.resource = '/sobjects/' + type + '/' + id;
  opts.method = 'PATCH';
  if(type === 'document' || type === 'attachment' || type === 'contentversion') {
    opts.multipart = multipart(opts);
  } else {
    opts.body = JSON.stringify(opts.sobject._getPayload(true));
  }
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.upsert = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var type = opts.sobject.getType();
  var extIdField = opts.sobject.getExternalIdField();
  var extId = opts.sobject.getExternalId();
  opts.resource = '/sobjects/' + type + '/' + extIdField + '/' + extId;
  opts.method = 'PATCH';
  opts.body = JSON.stringify(opts.sobject._getPayload(false));
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.delete = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var type = opts.sobject.getType();
  var id = opts.sobject.getId();
  opts.resource = '/sobjects/' + type + '/' + id;
  opts.method = 'DELETE';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getRecord = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var type = (opts.sobject) ? opts.sobject.getType() : opts.type;
  var id = (opts.sobject) ? opts.sobject.getId() : opts.id;
  var resolver = promises.createResolver(opts.callback);

  opts.resource = '/sobjects/' + type + '/' + id;
  opts.method = 'GET';

  if(opts.fields) {
    if(_.isString(opts.fields)) {
      opts.fields = [opts.fields];
    }
    opts.resource += '?' + qs.stringify({ fields: opts.fields.join() });
  }

  this._apiRequest(opts, function(err, resp){
    if(err) {
      return resolver.reject(err);
    }
    if(!opts.raw) {
      resp = new Record(resp);
      resp._reset();
    }
    resolver.resolve(resp);
  });

  return resolver.promise;
};

// blob methods

Connection.prototype.getBody = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var type = (opts.sobject) ? opts.sobject.getType() : opts.type;

  type = opts.type.toLowerCase();

  if(type === 'document') {
    return this.getDocumentBody(opts, opts.callback);
  } else if(type === 'attachment') {
    return this.getAttachmentBody(opts, opts.callback);
  } else if(type === 'contentversion') {
    return this.getContentVersionBody(opts, opts.callback);
  } else {
    var resolver = promises.createResolver(opts.callback);
    // resolve async
    process.nextTick(function(){
      resolver.reject(new Error('invalid type: ' + type));
    });
    return resolver.promise;
  }
};

Connection.prototype.getAttachmentBody = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? sobject.getId() : opts.id;
  opts.resource = '/sobjects/attachment/' + id + '/body';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getDocumentBody = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? sobject.getId() : opts.id;
  opts.resource = '/sobjects/document/' + id + '/body';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getContentVersionBody = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? sobject.getId() : opts.id;
  opts.resource = '/sobjects/contentversion/' + id + '/body';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype._queryHandler = function(data, callback) {
  var self = this;
  var recs = [];
  var opts = _.defaults(this._getOpts(data, callback), {
    fetchAll: false,
    raw: false
  });
  var resolver = promises.createResolver(opts.callback);

  opts.method = 'GET';
  opts.resource = '/query';

  if(opts.includeDeleted) {
    opts.resource += 'All';
  }

  opts.qs = {
    q: opts.query
  };

  function handleResults(err, resp) {
    if(err) {
      return resolver.reject(err);
    } else {
      if(resp.records && resp.records.length > 0) {
        _.each(resp.records, function(r) {
          if(opts.raw) {
            recs.push(r);
          } else {
            var rec = new Record(r);
            rec._reset();
            recs.push(rec);
          }
        });
      }
      if(opts.fetchAll && resp.nextRecordsUrl) {
        self.getUrl({ url: url, oauth: opts.oauth }, handleResults);
      } else {
        resp.records = recs;
        return resolver.resolve(resp);
      }
    }
  }

  this._apiRequest(opts, handleResults);

  return resolver.promise;
};

Connection.prototype.query = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.all = false;
  return this._queryHandler(opts, opts.callback);
};

Connection.prototype.queryAll = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.includeDeleted = true;
  return this._queryHandler(opts, opts.callback);
};

Connection.prototype.search = function(data, callback) {
  var opts = _.defaults(this._getOpts(data, callback), {
    raw: false
  });
  var resolver = promises.createResolver(opts.callback);

  opts.resource = '/search';
  opts.method = 'GET';
  opts.qs = { q: opts.search };

  this._apiRequest(opts, function(err, resp) {
    if(err) {
      return resolver.reject(err);
    } else {
      if(opts.raw || !resp.length) {
        return resolver.resolve(resp);
      } else {
        var recs = [];
        resp.forEach(function(r) {
          recs.push(new Record(r));
        });
        return resolver.resolve(resp);
      }
    }
  });

  return resolver.promise;
};

Connection.prototype.getUrl = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.uri = opts.oauth.instance_url + data.url;
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

// apex rest

Connection.prototype.apexRest = function(data, callback) {
  // need to specify resource
  var opts = this._getOpts(data, callback);
  opts.uri = opts.oauth.instance_url + '/services/apexrest/' + data.uri;
  opts.method = opts.method || 'GET';
  if(opts.urlParams) {
    opts.qs = opts.urlParams;
  }
  return this._apiRequest(opts, opts.callback);
};

// streaming methods

Connection.prototype.stream = function(data) {
  var that = this;
  var opts = this._getOpts(data);
  var client, endpoint;

  var str = new FDCStream();

  endpoint = opts.oauth.instance_url + '/cometd/' + that.apiVersion.substring(1);

  client = new faye.Client(endpoint, {});
  client.setHeader('Authorization', 'OAuth ' + opts.oauth.access_token);

  sub = client.subscribe('/topic/' + opts.topic, function(d){
    str.write(d);
  });

  sub.callback(function(){
    str.emit('connect');
  });

  sub.errback(function(error) {
    str.emit('error', error);
  });

  str.client = client;

  return str;
};

// express middleware

Connection.prototype.expressOAuth = function(opts) {
  var self = this;
  var matchUrl = url.parse(this.redirectUri);

  matchUrl.pathname.replace(/\/$/, '');

  if(opts.onSuccess && opts.onSuccess.substring(0,1) !== '/') {
    opts.onSuccess = '/' + opts.onSuccess;
  }

  if(opts.onError && opts.onError.substring(0,1) !== '/') {
    opts.onError = '/' + opts.onError;
  }

  return function(req, res, next) {

    var reqUrl;

    if(req.session && req.query.code) {
      reqUrl = req.url.replace(/\?.*/i, '').replace(/\/$/, '');
      if(matchUrl.pathname == reqUrl) {
        // its an oauth callback
        self.authenticate({ code: req.query.code }, function(err, resp){
          if(!err) {
            req.session.oauth = resp;
            if(opts.onSuccess) {
              res.redirect(opts.onSuccess);
            } else {
              res.redirect('/');
            }
          } else {
            // not sure how to handle the error right now.
            if(opts.onError) {
              // need to dump the error messages into the querystring
              res.redirect(opts.onError);
            } else {
              next();
            }
          }
        });

      }
    } else {
      next();
    }
  };
};

Connection.prototype._apiAuthRequest = function(opts, callback) {

  var self = this;

  var resolver = opts._resolver || promises.createResolver(callback);

  // set timeout
  if(this.timeout) {
    opts.timeout = this.timeout;
  }

  request(opts, function(err, res, body){
    // request returned an error
    if(err) return resolver.reject(err);

    // request didn't return a response. sumptin bad happened
    if(!res) return resolver.reject(errors.emptyResponse());

    if(body && util.isJsonResponse(res)) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return resolver.reject(errors.invalidJson());
      }
    }

    if(res.statusCode === 200) {
      // detect oauth response for single mode
      if(self.mode === 'single' && body.access_token) {
        self.oauth = body;
      }
      return resolver.resolve(body);
    } else {
      var e = new Error(body.error + ' - ' + body.error_description);
      e.statusCode = res.statusCode;
      return resolver.reject(e);
    }

  });

  return resolver.promise;
};

Connection.prototype._apiRequest = function(opts, callback) {

  /**
   * options:
   * - sobject
   * - uri
   * - callback
   * - oauth
   * - multipart
   * - method
   * - body
   * - qs
   * - headers
   */

  var self = this;
  var ropts = {};
  var resolver = opts._resolver || promises.createResolver(callback);
  var sobject = opts.sobject;

  // construct uri

  if(opts.uri) {
    ropts.uri = opts.uri;
  } else {
    if(!opts.resource || opts.resource.charAt(0) !== '/') {
      opts.resource = '/' + (opts.resource || '');
    }
    ropts.uri = [
      opts.oauth.instance_url,
      '/services/data/',
      this.apiVersion,
      opts.resource
    ].join('');
  }

  ropts.method = opts.method || 'GET';

  // set headers

  ropts.headers = {};

  ropts.headers['Accept'] = 'application/json;charset=UTF-8';

  if(opts.oauth) {
    ropts.headers['Authorization'] = 'Bearer ' + opts.oauth.access_token;
  }

  if(opts.method === 'GET' && this.gzip === true) {
    ropts.headers['Accept-Encoding'] = 'gzip';
    ropts.encoding = null;
  }

  if(opts.multipart) {
    ropts.multipart = opts.multipart;
    ropts.headers['content-type'] = 'multipart/form-data';
  } else {
    ropts.headers['content-type'] = 'application/json';
  }

  if(opts.headers) {
    for(var item in opts.headers) {
      ropts.headers[item] = opts.headers[item];
    }
  }

  // set body

  if(opts.body) {
    ropts.body = opts.body;
  }

  // process qs
  if(opts.qs) {
    ropts.qs = opts.qs;
  }

  // set timeout
  if(this.timeout) {
    ropts.timeout = this.timeout;
  }

  request(ropts, function(err, res, body) {

    // request returned an error
    if(err) return resolver.reject(err);

    // request didn't return a response. Sumptin bad happened
    if(!res) return resolver.reject(errors.emptyResponse());

    // salesforce returned no body but an error in the header
    if(!body && res.headers && res.headers.error) {
      return resolver.reject(new Error(res.headers.error), null);
    }

    var processResponse = function(data) {
      // attempt to parse the json now
      if(util.isJsonResponse(res)) {
        if(data) {
          try {
            data = JSON.parse(data);
          } catch (e) {
            return resolver.reject(errors.invalidJson());
          }
        }
      }

      // salesforce returned an ok of some sort
      if(res.statusCode >= 200 && res.statusCode <= 204) {
        // attach the id back to the sobject on insert
        if(sobject) {
          if(sobject._reset) {
            sobject._reset();
          }
          if(data && data.id) {
            sobject._fields.id = data.id;
          }
        }
        return resolver.resolve(data);
      }

      // salesforce returned an error with a body
      if (data) {
        var e;
        if (Array.isArray(data) && data.length > 0) {
          e = new Error(data[0].message);
          e.errorCode = data[0].errorCode;
          e.messageBody = data[0].message;
        } else {
          //  didn't get a json response back -- just a simple string as the body
          e = new Error(data);
          e.errorCode = data;
          e.messageBody = data;
        }
        e.statusCode = res.statusCode;

        // auto-refresh support
        if(e.errorCode && (e.errorCode === 'INVALID_SESSION_ID' || e.errorCode === 'Bad_OAuth_Token')
          && self.autoRefresh === true && opts.oauth.refresh_token && !opts._retryCount) {
          opts._retryCount = 1;
          opts._resolver = resolver;
          Connection.prototype.refreshToken.call(self, { oauth: opts.oauth, executeOnRefresh: true }, function(err2, res2) {
            if(err2) {
              return resolver.reject(err2);
            } else {
              return Connection.prototype._apiRequest.call(self, opts);
            }
          });
        } else {
          return resolver.reject(e);
        }

      } else {
        // we don't know what happened
        return resolver.reject(new Error('Salesforce returned no body and status code ' + res.statusCode));
      }

    };

    if(res.headers && res.headers['content-encoding'] === 'gzip' && body) {
      //  response is compressed - decompress it
      zlib.gunzip(body, function(err, data) {
        if (err) return callback(err);
        processResponse(data);
      });
    } else {
      processResponse(body);
    }

  });

  return resolver.promise;
};

// plugin system

function Plugin(opts) {
  this.namespace = opts.namespace;
  this._fns = {};
  this.util = _.clone(util);
}

Plugin.prototype.fn = function(fnName, fn) {
  if(typeof fn !== 'function') {
    throw new Error('invalid function provided');
  }
  if(typeof fnName !== 'string') {
    throw new Error('invalid function name provided');
  }
  this._fns[fnName] = fn;
};

// exports

module.exports.util = util;

module.exports.plugin = function(opts) {
  if(typeof opts === 'string') {
    opts = { namespace: opts };
  }
  if(!opts || !opts.namespace) {
    throw new Error('no namespace provided for plugin');
  }
  opts = _.defaults(opts, {
    override: false
  });
  if(plugins[opts.namespace] && opts.override !== true) {
    throw new Error('a plugin with namespace ' + opts.namespace + ' already exists');
  }
  plugins[opts.namespace] = new Plugin(opts);
  return plugins[opts.namespace];
};

// connection creation

module.exports.createConnection = function(opts) {
  return new Connection(opts);
};

module.exports.createSObject = function(type, fields) {
  var data = fields || {};
  data.attributes = {
    type: type
  };
  var rec = new Record(data);
  return rec;
};

module.exports.Record = Record;
module.exports.version = require('./package.json').version;
