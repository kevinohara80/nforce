var request   = require('request');
var promises  = require('./lib/promises');
var qs        = require('querystring');
var url       = require('url');
var Record    = require('./lib/record');
var FDCStream = require('./lib/fdcstream');
var util      = require('./lib/util');
var errors    = require('./lib/errors');
var multipart = require('./lib/multipart');
var faye      = require('faye');
var mime      = require('mime');
var zlib      = require('zlib');
var _         = require('lodash');

/*****************************
 * constants
 *****************************/

var AUTH_ENDPOINT      = 'https://login.salesforce.com/services/oauth2/authorize';
var TEST_AUTH_ENDPOINT = 'https://test.salesforce.com/services/oauth2/authorize';
var LOGIN_URI          = 'https://login.salesforce.com/services/oauth2/token';
var TEST_LOGIN_URI     = 'https://test.salesforce.com/services/oauth2/token';
var ENVS               = ['sandbox', 'production'];
var MODES              = ['multi', 'single'];
var API_VERSIONS       = [
  'v20.0', 'v21.0', 'v22.0', 'v23.0', 'v24.0',
  'v25.0', 'v26.0', 'v27.0', 'v28.0', 'v29.0',
  'v30.0', 'v31.0', 'v32.0', 'v33.0', 'v34.0',
  'v35.0', 'v36.0'
];

var plugins = {};

/*****************************
 * connection object
 *****************************/

var Connection = function(opts) {
  var self = this;

  opts = _.defaults(opts || {}, {
    clientId:         null,
    clientSecret:     null,
    redirectUri:      null,
    authEndpoint:     AUTH_ENDPOINT,
    testAuthEndpoint: TEST_AUTH_ENDPOINT,
    loginUri:         LOGIN_URI,
    testLoginUri:     TEST_LOGIN_URI,
    apiVersion:       _.last(API_VERSIONS),
    environment:      'production',
    mode:             'multi',
    gzip:             false,
    autoRefresh:      false,
    onRefresh:        undefined,
    timeout:          undefined,
    oauth:            undefined,
    username:         undefined,
    password:         undefined,
    securityToken:    undefined
  });

  // convert option values
  opts.apiVersion = opts.apiVersion.toString().toLowerCase().replace('v', '').replace('.0', '');
  opts.environment = opts.environment.toLowerCase();
  opts.mode = opts.mode.toLowerCase();

  self = _.assign(this, opts);

  // validate options
  if(!_.isString(this.clientId)) throw new Error('invalid or missing clientId');
  if(!_.isString(this.redirectUri)) throw new Error('invalid or missing redirectUri');
  if(!_.isString(this.authEndpoint)) throw new Error('invalid or missing authEndpoint');
  if(!_.isString(this.testAuthEndpoint)) throw new Error('invalid or missing testAuthEndpoint');
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
  // if(API_VERSIONS.indexOf(this.apiVersion) === -1) {
  //   throw new Error('api version ' + this.apiVersion + ' is not supported');
  // }

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

/*****************************
 * auth getters/setters
 *****************************/

Connection.prototype.getOAuth = function() {
  return this.oauth;
};

Connection.prototype.setOAuth = function(oauth) {
  this.oauth = oauth;
};

Connection.prototype.getUsername = function() {
  return this.username;
};

Connection.prototype.setUsername = function(username) {
  this.username = username;
};

Connection.prototype.getPassword = function() {
  return this.password;
};

Connection.prototype.setPassword = function(password) {
  this.password = password;
};

Connection.prototype.getSecurityToken = function() {
  return this.securityToken;
};

Connection.prototype.setSecurityToken = function(token) {
  this.securityToken = token;
};

/*****************************
 * helper methods
 *****************************/

Connection.prototype._getOpts = function(d, c, opts) {
  var data, cb, dt;

  opts = opts || {};

  if(_.isFunction(d)) {
    cb = d;
    dt = null;
  } else {
    cb = c;
    dt = d;
  }

  if(opts.singleProp && dt && !_.isObject(dt)) {
    data = {};
    data[opts.singleProp] = dt;
  } else if(_.isObject(dt)) {
    data = dt;
  } else {
    data = {};
  }

  data.callback = cb;

  if(this.mode === 'single' && !data.oauth) {
    data.oauth = this.oauth;
  }

  if(opts.defaults && _.isObject(opts.defaults)) {
    data = _.defaults(data, opts.defaults);
  }
  return data;
};

/*****************************
 * authentication methods
 *****************************/

Connection.prototype.getAuthUri = function(opts) {
  if(!opts) opts = {};

  var self = this;

  var urlOpts = {
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
    if(_.isArray(opts.scope)) {
      urlOpts.scope = opts.scope.join(' ');
    } else {
      urlOpts.scope = opts.scope;
    }
  }

  if(opts.state) {
    urlOpts.state = opts.state;
  }

  if(opts.nonce) {
    urlOpts.nonce = opts.nonce;
  }

  if(opts.prompt) {
    if(_.isArray(opts.prompt)) {
      urlOpts.prompt = opts.prompt.join(' ');
    } else {
      urlOpts.prompt = opts.prompt;
    }
  }

  if(opts.loginHint) {
    urlOpts.login_hint = opts.loginHint;
  }

  if(opts.urlOpts) {
    urlOpts = _.assign(urlOpts, opts.urlOpts);
  }

  var endpoint;

  if(opts.authEndpoint) {
    endpoint = opts.authEndpoint;
  } else if(self.environment == 'sandbox') {
    endpoint = this.testAuthEndpoint;
  } else {
    endpoint = this.authEndpoint;
  }

  return endpoint + '?' + qs.stringify(urlOpts);
};

Connection.prototype.authenticate = function(data, callback) {
  var self = this;
  var opts = _.defaults(this._getOpts(data, callback), {
    executeOnRefresh: false,
    oauth: {}
  });
  var resolver = promises.createResolver(opts.callback);

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
  } else if(opts.assertion) {
    bopts.grant_type = 'assertion';
    bopts.assertion_type = 'urn:oasis:names:tc:SAML:2.0:profiles:SSO:browser';
    bopts.assertion = opts.assertion;
  } else if(opts.username || this.username) {
    bopts.grant_type = 'password';
    bopts.username = opts.username || this.getUsername();
    bopts.password = opts.password || this.getPassword();
    if(opts.securityToken || this.getSecurityToken()) {
      bopts.password += opts.securityToken || this.getSecurityToken();
    }
    if(this.mode === 'single') {
      this.setUsername(bopts.username);
      this.setPassword(bopts.password);
      this.setSecurityToken(bopts.securityToken);
    }
  }

  opts.body = qs.stringify(bopts);

  this._apiAuthRequest(opts, function(err, res) {
    if(err) return resolver.reject(err);
    var old = _.clone(opts.oauth);
    _.assign(opts.oauth, res);
    if(opts.assertion) opts.oauth.assertion = opts.assertion;
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

Connection.prototype.refreshToken = function(data, callback) {
  var self = this;

  var opts = this._getOpts(data, callback, {
    defaults: {
      executeOnRefresh: true
    }
  });

  var resolver = promises.createResolver(opts.callback);

  opts.uri = (this.environment == 'sandbox') ? this.testLoginUri : this.loginUri;
  opts.method = 'POST';

  var refreshOpts = {
    client_id:     this.clientId,
    redirect_uri:  this.redirectUri
  };

  // support for SAML-based token refreshes
  if(!opts.oauth.refresh_token && (opts.oauth.assertion || opts.assertion)) {
    refreshOpts.grant_type = 'assertion';
    refreshOpts.assertion_type = 'urn:oasis:names:tc:SAML:2.0:profiles:SSO:browser';
    refreshOpts.assertion = opts.assertion || opts.oauth.assertion;
  } else {
    refreshOpts.grant_type = 'refresh_token';
    refreshOpts.refresh_token = opts.oauth.refresh_token;
  }

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
    if(opts.assertion) opts.oauth.assertion = opts.assertion;
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
  var opts = this._getOpts(data, callback, {
    singleProp: 'token'
  });

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
  var opts = this._getOpts(data, callback, {
    singleProp: 'id'
  });

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

Connection.prototype.getIdentity = function(data, callback) {
  var opts = this._getOpts(data, callback);
  opts.uri = opts.oauth.id;
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

/*****************************
 * system api methods
 *****************************/

Connection.prototype.getVersions = function(callback) {
  var opts = this._getOpts(null, callback);
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
  var opts = this._getOpts(data, callback, {
    singleProp: 'type'
  });
  opts.resource = '/sobjects/' + opts.type;
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getDescribe = function(data, callback) {
  var opts = this._getOpts(data, callback, {
    singleProp: 'type'
  });
  opts.resource = '/sobjects/' + opts.type + '/describe';
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getLimits = function(data, callback) {
  var opts = this._getOpts(data, callback, {
    singleProp: 'type'
  });
  opts.resource = '/limits'
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

/*****************************
 * crud methods
 *****************************/

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

/*****************************
 * blob/binary methods
 *****************************/

Connection.prototype.getBody = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var type = (opts.sobject) ? opts.sobject.getType() : opts.type;

  type = type.toLowerCase();

  if(type === 'document') {
    return this.getDocumentBody(opts, opts.callback);
  } else if(type === 'attachment') {
    return this.getAttachmentBody(opts, opts.callback);
  } else if(type === 'contentversion') {
    return this.getContentVersionData(opts, opts.callback);
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
  opts.blob = true;
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getDocumentBody = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? sobject.getId() : opts.id;
  opts.resource = '/sobjects/document/' + id + '/body';
  opts.method = 'GET';
  opts.blob = true;
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getContentVersionBody = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? sobject.getId() : opts.id;
  opts.resource = '/sobjects/contentversion/' + id + '/body';
  opts.method = 'GET';
  opts.blob = true;
  return this._apiRequest(opts, opts.callback);
};

Connection.prototype.getContentVersionData = function(data, callback) {
  var opts = this._getOpts(data, callback);
  var id = (opts.sobject) ? sobject.getId() : opts.id;
  opts.resource = '/sobjects/contentversion/' + id + '/versiondata';
  opts.method = 'GET';
  opts.blob = true;
  return this._apiRequest(opts, opts.callback);
};

/*****************************
 * query
 *****************************/

Connection.prototype.query = function(data, callback) {
  var opts = this._getOpts(data, callback, {
    singleProp: 'query',
    defaults: {
      fetchAll: false,
      includeDeleted: false,
      raw: false
    }
  });
  return this._queryHandler(opts, opts.callback);
};

Connection.prototype.queryAll = function(data, callback) {
  var opts = this._getOpts(data, callback, {
    singleProp: 'query',
    defaults: {
      fetchAll: false,
      raw: false
    }
  });
  opts.includeDeleted = true;
  return this._queryHandler(opts, opts.callback);
};

Connection.prototype._queryHandler = function(data, callback) {
  var self = this;
  var recs = [];
  var opts = this._getOpts(data, callback);
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
        self.getUrl({ url: resp.nextRecordsUrl, oauth: opts.oauth }, handleResults);
      } else {
        resp.records = recs;
        return resolver.resolve(resp);
      }
    }
  }

  this._apiRequest(opts, handleResults);

  return resolver.promise;
};

/*****************************
 * search
 *****************************/

Connection.prototype.search = function(data, callback) {
  var opts = this._getOpts(data, callback, {
    singleProp: 'search',
    defaults: {
      raw: false
    }
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
  var opts = this._getOpts(data, callback, {
    singleProp: 'url'
  });
  opts.uri = opts.oauth.instance_url + data.url;
  opts.method = 'GET';
  return this._apiRequest(opts, opts.callback);
};

/*****************************
 * apex rest
 *****************************/

Connection.prototype.apexRest = function(data, callback) {
  var opts = this._getOpts(data, callback, {
    singleProp: 'uri'
  });
  opts.uri = opts.oauth.instance_url + '/services/apexrest/'
    // Allow for data.uri to start with or without a /
    + ((data.uri.substring(0,1)==='/') ? data.uri.substring(1) : data.uri);
  opts.method = opts.method || 'GET';
  if(opts.urlParams) {
    opts.qs = opts.urlParams;
  }
  return this._apiRequest(opts, opts.callback);
};

/*****************************
 * streaming api
 *****************************/

Connection.prototype.createStreamClient = function(data) {
  var self = this;
  var opts = this._getOpts(data, null, {
    defaults: {
      apiVersion: self.apiVersion,
      timeout: null,
      retry: null
    }
  });
  return new FDCStream.Client(opts);
};

Connection.prototype.subscribe = function(data) {
  var opts = this._getOpts(data, null, {
    singleProp: 'topic',
    defaults: {
      isSystem: false,
      timeout: null,
      retry: null
    }
  });

  var client = this.createStreamClient(opts);
  return client.subscribe(opts);
};

// keeping this method for backwards compatibility
// proxies to connection.subscribe now
Connection.prototype.stream = function(data) {
  return this.subscribe(data);
};

/*****************************
 * auto-refresh
 *****************************/

Connection.prototype.autoRefreshToken = function(data, callback) {
  var self = this;

  var opts = this._getOpts(data, callback, {
    defaults: {
      executeOnRefresh: true
    }
  });

  var resolver = promises.createResolver(opts.callback);

  var refreshOpts = {
    oauth: opts.oauth,
    executeOnRefresh: opts.executeOnRefresh
  };

  // auto-refresh: refresh token
  if(opts.oauth.refresh_token) {
    Connection.prototype.refreshToken.call(self, refreshOpts, function(err, res) {
      if(err) {
        return resolver.reject(err);
      } else {
        return resolver.resolve(res);
      }
    });
    // auto-refresh: un/pw
  } else {
    Connection.prototype.authenticate.call(self, refreshOpts, function(err, res) {
      if(err) {
        return resolver.reject(err);
      } else {
        return resolver.resolve(res);
      }
    });
  }

  return resolver.promise;
};

/*****************************
 * internal api methods
 *****************************/

Connection.prototype._apiAuthRequest = function(opts, callback) {

  var self = this;

  var resolver = opts._resolver || promises.createResolver(callback);

  // set timeout
  if(this.timeout) {
    opts.timeout = this.timeout;
  }

  // process request opts
  if(opts.requestOpts) {
    _.merge(opts, opts.requestOpts);
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
      if(body.access_token) {
        if(self.mode === 'single') {
          self.oauth = body;
        }
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
   * - encoding
   * - body
   * - qs
   * - headers
   */

  var self     = this;
  var ropts    = {};
  var resolver = opts._resolver || promises.createResolver(callback);
  var sobject  = opts.sobject;

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

  // set blob mode
  if(opts.blob === true) {
    ropts.encoding = null;
  }

  ropts.method = opts.method || 'GET';

  // set accept headers
  ropts.headers = {
    'Accept': 'application/json;charset=UTF-8'
  };

  // set oauth header
  if(opts.oauth) {
    ropts.headers['Authorization'] = 'Bearer ' + opts.oauth.access_token;
  }

  // set gzip headers
  if(opts.method === 'GET' && this.gzip === true) {
    ropts.headers['Accept-Encoding'] = 'gzip';
    ropts.encoding = null;
  }

  // set content-type
  if(opts.multipart) {
    ropts.headers['content-type'] = 'multipart/form-data';
    ropts.multipart = opts.multipart;
    ropts.preambleCRLF = true;
    ropts.postambleCRLF = true;
  } else {
    ropts.headers['content-type'] = 'application/json';
  }

  // set additional user-supplied headers
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

  // process request opts
  if(opts.requestOpts) {
    _.merge(ropts, opts.requestOpts);
  }

  // set timeout
  if(this.timeout) {
    ropts.timeout = this.timeout;
  }

  // initiate the request
  request(ropts, function(err, res, body) {

    // request returned an error
    if(err) return resolver.reject(err);

    // request didn't return a response. Sumptin bad happened
    if(!res) return resolver.reject(errors.emptyResponse());

    // salesforce returned no body but an error in the header
    if(!body && res.headers && res.headers.error) {
      var e = new Error(res.headers.error);
      e.statusCode = res.statusCode;
      return resolver.reject(e);
    }

    function processResponse() {
      // attempt to parse the json now
      if(util.isJsonResponse(res)) {
        if(body) {
          try {
            body = JSON.parse(body);
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
          if(body && _.isObject(body) && body.id) {
            sobject._fields.id = body.id;
          }
        }
        return resolver.resolve(body);
      }

      // error handling
      var e;

      // error: no body
      if(!body) {
        e = new Error('Salesforce returned no body and status code ' + res.statusCode);
      // error: array body
      } else if (_.isArray(body) && body.length > 0) {
        e = new Error(body[0].message);
        e.errorCode = body[0].errorCode;
        e.body = body;
      // error: string body
      } else if(_.isString(body)) {
        e = new Error(body);
        e.errorCode = body;
        e.body = body;
      } else {
        e = new Error('Salesforce returned an unrecognized error ' + res.statusCode);
        e.body = body;
      }

      e.statusCode = res.statusCode;

      // confirm auto-refresh support
      if(e.errorCode &&
          (e.errorCode === 'INVALID_SESSION_ID' || e.errorCode === 'Bad_OAuth_Token') &&
          self.autoRefresh === true &&
          (opts.oauth.refresh_token || (self.getUsername() && self.getPassword())) &&
          !opts._retryCount) {

        // attempt the autorefresh
        Connection.prototype.autoRefreshToken.call(self, opts, function(err2, res2) {
          if(err2) {
            return resolver.reject(err2);
          } else {
            opts._retryCount = 1;
            opts._resolver = resolver;
            return Connection.prototype._apiRequest.call(self, opts);
          }
        });

      } else {
        return resolver.reject(e);
      }
    }

    // check for gzip compression
    if(res.headers && res.headers['content-encoding'] === 'gzip' && body) {
      //  response is compressed - decompress it
      zlib.gunzip(body, function(err, decompressed) {
        if (err) return resolver.reject(err);
        body = decompressed;
        processResponse();
      });
    } else {
      processResponse();
    }

  });

  return resolver.promise;
};

/*****************************
 * plugin system
 *****************************/

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

  return this;
};

/*****************************
 * exports
 *****************************/

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

module.exports.Record  = Record;
module.exports.version = require('./package.json').version;
