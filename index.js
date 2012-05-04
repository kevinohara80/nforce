// module dependencies

var request = require('request');
var qs = require('querystring');
var url = require('url');

// constants

var AUTH_ENDPOINT = 'https://login.salesforce.com/services/oauth2/authorize';
var TEST_AUTH_ENDPOINT = 'https://test.salesforce.com/services/oauth2/authorize';
var LOGIN_URI = 'https://login.salesforce.com/services/oauth2/token';
var TEST_LOGIN_URI = 'https://test.salesforce.com/services/oauth2/token';
var API_VERSIONS = ['v20.0', 'v21.0', 'v22.0', 'v23.0', 'v24.0'];

// nforce connection object

var Connection = function(opts) {
  if(!opts) opts = {};
  if(typeof opts.clientId === 'undefined' || typeof opts.clientId !== 'string') {
    throw new Error('Invalid or missing clientId');
  } else {
    this.clientId = opts.clientId;
  }
  if(typeof opts.clientSecret === 'undefined' || typeof opts.clientSecret !== 'string') {
    throw new Error('Invalid or missing clientSecret');
  } else {
    this.clientSecret = opts.clientSecret;
  }
  if(typeof opts.redirectUri === 'undefined' || typeof opts.redirectUri !== 'string') {
    throw new Error('Invalid or missing redirectUri');
  } else {
    this.redirectUri = opts.redirectUri;
  }  
  if(typeof opts.cacheMetadata !== 'undefined') {
    if(typeof opts.cacheMetadata !== 'boolean') throw new Error('cacheMetadata must be a boolean');
    this.cacheMetadata = opts.cacheMetadata;
  } else {
    // caching is defaulted to false
    this.cacheMetadata = true;
  }
  if(this.cacheMetadata) {
    this._cache = {
      keyPrefixes: {},
      sObjects: {}
    }
  }
  if(opts.apiVersion) {
    if(typeof opts.apiVersion === 'number') {
      opts.apiVersion = opts.apiVersion.toString();
      if(opts.apiVersion.length === 2) opts.apiVersion = opts.apiVersion + '.0';
    }
    opts.apiVersion = opts.apiVersion.toLowerCase();
    if(/^\d\d\.\d$/g.test(opts.apiVersion)) {
      opts.apiVersion = 'v' + opts.apiVersion;
    } else if(/^\d\d$/g.test(opts.apiVersion)) {
      opts.apiVersion = 'v' + opts.apiVersion + '.0';
    } else if(/^v\d\d$/g.test(opts.apiVersion)) {
      opts.apiVersion = opts.apiVersion + '.0';
    }
    if(API_VERSIONS.indexOf(opts.apiVersion) === -1 ) {
      throw new Error(opts.apiVersion + ' is an invalid api version');
    } else {
      this.apiVersion = opts.apiVersion;
    }
  } else {
    this.apiVersion = 'v24.0';
  }
  if(opts.environment) {
    if(opts.environment.toLowerCase() == 'sandbox' || opts.environment.toLowerCase() == 'production') {
      this.environment = opts.environment.toLowerCase();
    } else {
      throw new Error(opts.environment + ' is an invalid environment');
    }
  } else {
    this.environment = 'production';
  }
}

// oauth methods

Connection.prototype.getAuthUri = function() {
  var self = this;
  var opts = {
    'response_type': 'code',
    'client_id': self.clientId,
    'client_secret': self.clientSecret,
    'redirect_uri': self.redirectUri
  }
  if(self.environment == 'sandbox') {
    return TEST_AUTH_ENDPOINT + '?' + qs.stringify(opts);
  } else {
    return AUTH_ENDPOINT + '?' + qs.stringify(opts);
  }
}

Connection.prototype.authenticate = function(opts, callback) {
  
  var self = this;
  if(!opts) opts = {};
  
  var bodyOpts = {
    'client_id': self.clientId,
    'client_secret': self.clientSecret,
  }
  
  if(opts.code) {
    bodyOpts['grant_type'] = 'authorization_code';
    bodyOpts['code'] = opts.code;
    bodyOpts['redirect_uri'] = self.redirectUri;
  } else if(opts.username && opts.password) {
    bodyOpts['grant_type'] = 'password';
    bodyOpts['username'] = opts.username;
    bodyOpts['password'] = opts.password;
  } else {
    var err = new Error('You must either supply a code, or username and password');
    callback(err, null);
    return;
  }
  
  var uri = (self.environment == 'sandbox') ? TEST_LOGIN_URI : LOGIN_URI;
  
  var reqOpts = {
    uri: uri,
    method: 'POST',
    body: qs.stringify(bodyOpts),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  
  request(reqOpts, function(err, res, body){
    if(body) body = JSON.parse(body);
    if(!err && res.statusCode == 200) {
      callback(null, body);
    } else if(!err) {
      if(body) err = new Error(body.error + ': ' + body.error_description);
      callback(err, null);
    } else {
      callback(err, null);
    }
  });
  
}


Connection.prototype.refreshToken = function(opts, callback) {

}

// api methods

Connection.prototype.getIdentity = function(oauth, callback) {
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var opts = { uri: oauth.id, method: 'GET'}
  apiRequest(opts, oauth, callback);
}

Connection.prototype.getVersions = function(callback) {
  request('http://na1.salesforce.com/services/data/', function(err, res, body){
    if(!err && res.statusCode == 200) {
      callback(null, JSON.parse(body));
    } else {
      callback(err, null);
    }
  });
}

Connection.prototype.getResources = function(oauth, callback) {
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion;
  var opts = { uri: uri, method: 'GET' }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.getSObjects = function(oauth, callback) {
  var self = this;
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects';
  var opts = { uri: uri, method: 'GET' }
  apiRequest(opts, oauth, function(err, resp){
    if(err) {
      callback(err, null);
    } else {
      if(self.cacheMetadata) {
        for(var obj in resp.sobjects) {
          var so = resp.sobjects[obj];
          if(so.keyPrefix != null) self._cache.keyPrefixes[so.keyPrefix] = so.name;
        }
      }
      callback(null, resp);
    }
  });
}

Connection.prototype.getMetadata = function(data, oauth, callback) {
  if(typeof data !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data;
  var opts = { uri: uri, method: 'GET' }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.getDescribe = function(data, oauth, callback) {
  if(typeof data.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data.type + '/describe';
  var opts = { uri: uri, method: 'GET' }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.insert = function(data, oauth, callback) {
  if(typeof data.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  if(typeof data.fieldValues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data.type;
  var opts = { uri: uri, method: 'POST', body: JSON.stringify(data.fieldValues) }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.update = function(data, oauth, callback) {
  if(typeof data.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  if(typeof data.id !== 'string') {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  if(typeof data.fieldValues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data.type + '/' + data.id;
  var opts = { uri: uri, method: 'PATCH', body: JSON.stringify(data.fieldValues) }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.upsert = function(data, oauth, callback) {
  if(typeof data.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  if(typeof data.externalId !== 'string') {
    return callback(new Error('You must specify an external id in the form of a string'));
  }
  if(typeof data.externalIdField !== 'string') {
    return callback(new Error('You must specify an external id field in the form of a string'));
  }
  if(typeof data.fieldValues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' 
    + data.type + '/' + data.externalIdField + '/' + data.externalId;
  var opts = { uri: uri, method: 'PATCH', body: JSON.stringify(data.fieldValues) }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.delete = function(data, oauth, callback) {
  if(typeof data.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  if(typeof data.id !== 'string') {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data.type + '/' + data.id;
  var opts = { uri: uri, method: 'DELETE'}
  apiRequest(opts, oauth, callback);
}

Connection.prototype.getRecord = function(data, oauth, callback) {
  if(typeof data.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  if(typeof data.id !== 'string') {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data.type + '/' + data.id;
  if(data.fields) {
    var query = {}
    if(typeof data.fields === 'string') {
      query.fields = data.fields;
    } else if(typeof data.fields === 'object' && data.fields.length) {
      query.fields = data.fields.join();
    }
    uri += '?' + qs.stringify(query);
  }
  var opts = { uri: uri, method: 'GET'}
  apiRequest(opts, oauth, callback);
}

Connection.prototype.query = function(query, oauth, callback) {
  if(typeof query !== 'string') {
    return callback(new Error('Query must be in string form'), null);
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/query';
  var opts = { uri: uri, method: 'GET', qs: { q: query } }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.search = function(search, oauth, callback) {
  if(typeof search !== 'string') {
    return callback(new Error('Search must be in string form'), null);
  }
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return callback(new Error('Invalid oauth object argument'), null);
  }
  var uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/search';
  var opts = { uri: uri, method: 'GET', qs: { q: search } }
  apiRequest(opts, oauth, callback);
}

Connection.prototype.getUrl = function(url, auth, callback) {
  var uri = auth.instance_url + url;
  var opts = { uri: uri, method: 'GET' }
  apiRequest(opts, oauth, callback);
}

// chatter api methods

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
    
    if(req.session && req.query.code) {
      var url = req.url.replace(/\?.*/i, '').replace(/\/$/, '');
      if(matchUrl.pathname == url) {
        // its an oauth callback
        self.authenticate({ code: req.query.code}, function(err, resp){
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
              res.redirect(opts.onError)
            } else {
              next();
            }
          }
        });
      } 
    } else {
      next();
    }
  }
}

// utility methods

var apiRequest = function(opts, oauth, callback) {
  var token = 'OAuth ' + oauth.access_token;
  opts.headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  }
  request(opts, function(err, res, body) {
    if(!err && res.statusCode == 200 || res.statusCode == 201 || res.statusCode == 202 || res.statusCode == 204) {
      if(body) body = JSON.parse(body);
      callback(null, body);
    } else if(!err) {
      if(body) body = JSON.parse(body);
      err = new Error(body[0].message);
      err.errorCode = body[0].errorCode;
      err.statusCode = res.statusCode;
      callback(err, null);
    } else {
      callback(err, null);
    }
  });
  
}

// exports

module.exports.createConnection = function(opts) {
  return new Connection(opts);
}

module.exports.version = '0.0.2';