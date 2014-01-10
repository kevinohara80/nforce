// module dependencies

var request     = require('request');
var qs          = require('querystring');
var url         = require('url');
var Record      = require('./lib/record');
var QueryStream = require('./lib/querystream');
var FDCStream   = require('./lib/fdcstream');
var faye        = require('faye');
var mime        = require('mime');
var base64url   = require('base64url');
var crypto      = require('crypto');

var zlib        = require('zlib');
var _           = require('lodash');

// constants

var AUTH_ENDPOINT      = 'https://login.salesforce.com/services/oauth2/authorize';
var TEST_AUTH_ENDPOINT = 'https://test.salesforce.com/services/oauth2/authorize';
var LOGIN_URI          = 'https://login.salesforce.com/services/oauth2/token';
var TEST_LOGIN_URI     = 'https://test.salesforce.com/services/oauth2/token';
var API_VERSIONS       = ['v20.0', 'v21.0', 'v22.0', 'v23.0', 'v24.0', 'v25.0', 'v26.0', 'v27.0', 'v28.0', 'v29.0'];

var ENVS               = ['sandbox', 'production'];
var MODES              = ['multi', 'single'];

// nforce utility functions

var util = {};

var plugins = {};

util.isJsonResponse = function(res) {
  return res.headers 
    && res.headers['content-type'] 
    && res.headers['content-type'].split(';')[0].toLowerCase() === 'application/json';
}

util.findId = function(data) {
  if(data.getId && _.isFunction(data.getId)) {
    return data.getId();
  } else if(data.Id) {
    return data.Id
  } if(data.id) {
    return data.id;
  } else if(data.ID) {
    return data.ID;
  }
}

util.validateOAuth = function(oauth) {
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return false;
  } else {
    return true;
  }
}

util._ = _;

// nforce connection object

var Connection = function(opts) {
  var self = this;

  opts = _.defaults(opts || {}, {
    clientId:      null,
    clientSecret:  null,
    redirectUri:   null,
    loginUri:      LOGIN_URI,
    testLoginUri:  TEST_LOGIN_URI,
    cacheMetadata: false,
    apiVersion:    _.last(API_VERSIONS),
    environment:   'production',
    mode:          'multi',
    gzip:          false
  });

  // convert option values

  opts.apiVersion = opts.apiVersion.toString().toLowerCase().replace('v', '').replace('\.0', '');
  opts.environment = opts.environment.toLowerCase();
  opts.mode = opts.mode.toLowerCase()

  self = _.assign(this, opts);

  // validate options

  if(!_.isString(this.clientId)) throw new Error('invalid or missing clientId');
  if(!_.isString(this.clientSecret)) throw new Error('invalid or missing clientSecret');
  if(!_.isString(this.redirectUri)) throw new Error('invalid or missing redirectUri');
  if(!_.isString(this.loginUri)) throw new Error('invalid or missing loginUri');
  if(!_.isString(this.testLoginUri)) throw new Error('invalid or missing testLoginUri');
  if(!_.isBoolean(this.cacheMetadata)) throw new Error('cacheMetadata must be a boolean');
  if(!_.isBoolean(this.gzip)) throw new Error('gzip must be a boolean');
  if(!_.isString(this.environment) || _.indexOf(ENVS, this.environment) === -1) {
    throw new Error('invalid environment, only ' + ENVS.join(' and ') + ' are allowed');
  }
  if(!_.isString(this.mode) || _.indexOf(MODES, this.mode) === -1) {
    throw new Error('invalid mode, only ' + MODES.join(' and ') + ' are allowed');
  }
  
  // setup cache

  if(this.cacheMetadata) {
    this._cache = {
      keyPrefixes: {},
      sObjects: {}
    }
  }

  // parse api version

  try {
    this.apiVersion = 'v' + parseInt(this.apiVersion, 10) + '.0';
  } catch (err) {
    throw new Error('invalid apiVersion number');
  }
  if(API_VERSIONS.indexOf(this.apiVersion) === -1) {
    throw new Error('api version ' + this.apiVersion + ' is not supported');
  }

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

}

// oauth methods

Connection.prototype.getAuthUri = function(opts) {
  if(!opts) opts = {};
  var urlOpts;
  var self = this;
  
  urlOpts = {
    'response_type': 'code',
    'client_id': self.clientId,
    'redirect_uri': self.redirectUri
  }

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
}

Connection.prototype.authenticate = function(opts, callback) {
  var uri, reqOpts, bodyOpts;
  var self = this;

  if(!callback) callback = function(){}

  if(!opts) opts = {};

  bodyOpts = {
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
    if(opts.securityToken) {
      bodyOpts['password'] = bodyOpts['password'] + opts.securityToken;
    }
  } else {
    return callback(new Error('You must either supply a code, or username and password'));
  }

  uri = (self.environment == 'sandbox') ? this.testLoginUri : this.loginUri;

  reqOpts = {
    uri: uri,
    method: 'POST',
    body: qs.stringify(bodyOpts),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  
  return this._apiAuthRequest(reqOpts, callback);

}


Connection.prototype.refreshToken = function(oauth, callback) {
  var uri, reqOpts, bodyOpts;
  var self = this;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 1) callback = args[0];
  }

  if(!callback) callback = function(){};

  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  if(!oauth.refresh_token) return callback(new Error('You must supply a refresh token'));

  bodyOpts = {
    'client_id': self.clientId,
    'client_secret': self.clientSecret,
    'grant_type': 'refresh_token',
    'redirect_uri': self.redirectUri,
    'refresh_token': oauth.refresh_token
  }

  uri = (self.environment == 'sandbox') ? this.testLoginUri : this.loginUri;

  reqOpts = {
    uri: uri,
    method: 'POST',
    body: qs.stringify(bodyOpts),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  return this._apiAuthRequest(reqOpts, callback);
}

// api methods

Connection.prototype.getIdentity = function(oauth, callback) {
  var opts;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 1) callback = args[0];
  }
  
  if(!callback) callback = function(){}
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  opts = { uri: oauth.id, method: 'GET'}
  
  return this._apiRequest(opts, oauth, null, callback);
}

Connection.prototype.getVersions = function(callback) {
  var opts;

  if(!callback) callback = function(){}
  
  opts = { uri : 'http://na1.salesforce.com/services/data/', method: 'GET' };
  
  return this._apiAuthRequest(opts, callback);
}

Connection.prototype.getResources = function(oauth, callback) {
  var uri, opts;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 1) callback = args[0];
  }
  
  if(!callback) callback = function(){}
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion;
  opts = { uri: uri, method: 'GET' }
  
  return this._apiRequest(opts, oauth, null, callback);
}

Connection.prototype.getSObjects = function(oauth, callback) {
  var uri, opts;
  var self = this;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 1) callback = args[0];
  }
  
  if(!callback) callback = function(){}
  
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects';
  opts = { uri: uri, method: 'GET' }
  
  return this._apiRequest(opts, oauth, null, function(err, resp){
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
  var uri, opts;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof data !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data;
  opts = { uri: uri, method: 'GET' }
  
  return this._apiRequest(opts, oauth, null, callback);
}

Connection.prototype.getDescribe = function(data, oauth, callback) {
  var uri, opts;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof data !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + data + '/describe';
  opts = { uri: uri, method: 'GET' }
  
  return this._apiRequest(opts, oauth, null, callback);
}

Connection.prototype.insert = function(data, oauth, callback) {
  var type, opts, entity, name, fieldvalues;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  if(typeof data.attributes.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  type = data.attributes.type.toLowerCase();
  
  fieldvalues = data.getFieldValues();
  
  if(typeof fieldvalues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  opts = { 
    uri: oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + type, 
    method: 'POST' 
  };
  
  if(type === 'document' || type === 'attachment' || type === 'contentversion') {
    entity = (type === 'contentversion') ? 'content' : type;
    name   = (type === 'contentversion') ? 'VersionData' : 'Body';
    opts.multipart = [
      {
        'content-disposition': 'form-data; name="entity_' + entity + '"',
        'content-type': 'application/json',
        body: JSON.stringify(fieldvalues)
      },
      {
        'content-type': mime.lookup(data.attachment.fileName),
        'content-disposition': 'form-data; name="' + name + '"; filename="' + data.attachment.fileName + '"',
        body: data.attachment.body
      }
    ]; 
  } else {
    opts.body = JSON.stringify(fieldvalues);
  }
  
  return this._apiRequest(opts, oauth, data, callback);
}

Connection.prototype.update = function(data, oauth, callback) {
  var type, opts, entity, name, id, fieldvalues;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof data.attributes.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  type = data.attributes.type.toLowerCase();
  
  if(!(id = util.findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  fieldvalues = data.getFieldValues();
  
  if(typeof fieldvalues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  opts = { 
    uri: oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/' + type + '/' + id, 
    method: 'PATCH' 
  };
  
  if(type === 'document' || type === 'attachment' || type === 'contentversion') {
    entity = (type === 'contentversion') ? 'content' : type;
    name   = (type === 'contentversion') ? 'VersionData' : 'Body';
    opts.multipart = [
      {
        'content-disposition': 'form-data; name="entity_' + entity + '"',
        'content-type': 'application/json',
        body: JSON.stringify(fieldvalues)
      },
      {
        'content-type': mime.lookup(data.attachment.fileName),
        'content-disposition': 'form-data; name="' + name + '"; filename="' + data.attachment.fileName + '"',
        body: data.attachment.body
      }
    ];
  } else {
    opts.body = JSON.stringify(fieldvalues);
  }
  
  return this._apiRequest(opts, oauth, data, callback);
}

Connection.prototype.upsert = function(data, oauth, callback) {
  var type, fieldvalues, uri, opts;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof data.attributes.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  type = data.attributes.type.toLowerCase();
  
  if(!data.attributes.externalId || !data.attributes.externalIdField) {
    return callback(new Error('Invalid external id or external id field'));
  }
  
  fieldvalues = data.getFieldValues();
  
  if(typeof fieldvalues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/'
    + type + '/' + data.attributes.externalIdField + '/' + data.attributes.externalId;
  opts = { uri: uri, method: 'PATCH', body: JSON.stringify(fieldvalues) }
  
  return this._apiRequest(opts, oauth, data, callback);
}

Connection.prototype.delete = function(data, oauth, callback) {
  var type, uri, opts, id;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof data.attributes.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  type = data.attributes.type.toLowerCase();
  
  if(!(id = util.findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/'
    + type + '/' + data.getId();
  opts = { uri: uri, method: 'DELETE' }
  
  return this._apiRequest(opts, oauth, data, callback);
}

Connection.prototype.getRecord = function(data, oauth, callback) {
  var type, uri, opts, id, query;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof data.attributes.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  type = data.attributes.type.toLowerCase();
  
  if(!(id = util.findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/'
    + type + '/' + id;
  
  if(data.fields) {
    query = {}
    if(typeof data.fields === 'string') {
      query.fields = data.fields;
    } else if(typeof data.fields === 'object' && data.fields.length) {
      query.fields = data.fields.join();
    }
    uri += '?' + qs.stringify(query);
  }
  
  opts = { uri: uri, method: 'GET' }
  
  return this._apiRequest(opts, oauth, null, function(err, resp){
    if(!err) {
      resp = new Record(resp);
    }
    callback(err, resp);
  });
}

// blob methods

Connection.prototype.getBody = function(data, oauth, callback) {
  var type, id, uri;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){};
  
  if(typeof data.attributes.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  type = data.attributes.type.toLowerCase();
  
  if(!(id = util.findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  if(type === 'document') {
    return this.getDocumentBody(id, oauth, callback);
  } else if(type === 'attachment') {
    return this.getAttachmentBody(id, oauth, callback);
  } else if(type === 'contentversion') {
    return this.getContentVersionBody(id, oauth, callback);
  } else {
    return callback(new Error('sobject is of invalid type: ' + type));
  }
}

Connection.prototype.getAttachmentBody = function(id, oauth, callback) {
  var uri, opts;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){};
  
  if(typeof id === 'object') id = util.findId(id);
  
  if(!id) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  uri = oauth.instance_url + '/services/data' + this.apiVersion 
    + '/sobjects/Attachment/' + id + '/body'
  opts = { uri: uri, method: 'GET' }
  
  return this._apiBlobRequest(opts, oauth, function(err, resp) {
    callback(err, resp);
  });
}

Connection.prototype.getDocumentBody = function(id, oauth, callback) {
  var uri, opts;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){};
  
  if(typeof id === 'object') id = findId(id);
  
  if(!id) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  uri = oauth.instance_url + '/services/data' + this.apiVersion 
    + '/sobjects/Document/' + id + '/body'
  opts = { uri: uri, method: 'GET' }
  
  return this._apiBlobRequest(opts, oauth, function(err, resp) {
    callback(err, resp);
  });
}

Connection.prototype.getContentVersionBody = function(id, oauth, callback) {
  var uri, opts;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }

  if(!callback) callback = function(){};
  
  if(typeof id === 'object') id = util.findId(id);
  
  if(!id) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  uri = oauth.instance_url + '/services/data' + this.apiVersion 
    + '/sobjects/ContentVersion/' + id + '/body'
  opts = { uri: uri, method: 'GET' }
  
  return this._apiBlobRequest(opts, oauth, function(err, resp) {
    callback(err, resp);
  });
}

Connection.prototype._queryHandler = function(query, oauth, all, callback) {
  var uri, opts, stream;
  var self = this;
  var recs = [];

  if(!callback) callback = function(){}

  stream = new QueryStream();

  if(typeof query !== 'string') {
    return callback(new Error('You must specify a query'));
  }

  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);

  var queryNext = function(url) {
    self.getUrl(url, oauth, function(err, resp) {
      if (err) {
        return stream.error(err);
      }
      if(resp.records && resp.records.length > 0) {
        stream.write(JSON.stringify(resp));
      }
      if(resp.nextRecordsUrl) {
        queryNext(resp.nextRecordsUrl);
      } else {
        stream.end();
      }
    });
  }

  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/query';

  // support queryAll
  if(all) uri += 'All';

  opts = { uri: uri, method: 'GET', qs: { q: query } }
  
  this._apiRequest(opts, oauth, null, function(err, resp){
    if (stream.isStreaming()) {
      if (err) {
        stream.error(err);
      }
      else {
        if(resp) {
          stream.write(JSON.stringify(resp));
        }
        if(resp.nextRecordsUrl) {
          queryNext(resp.nextRecordsUrl);
        } else {
          stream.end();
        }
      }
    }
    else {
      if(!err) {
        if(resp.records && resp.records.length > 0) {
          for(var i=0; i<resp.records.length; i++) {
            recs.push(new Record(resp.records[i]));
          }
          resp.records = recs;
        }
      }
      callback(err, resp);
    }
  });

  return stream;
}

Connection.prototype.query = function(query, oauth, callback) {
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length === 2) callback = args[1];
  }
  return this._queryHandler(query, oauth, false, callback);
}

Connection.prototype.queryAll = function(query, oauth, callback) {
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length === 2) callback = args[1];
  }
  return this._queryHandler(query, oauth, true, callback);
}

Connection.prototype.search = function(search, oauth, callback) {
  var uri, opts;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }

  if(!callback) callback = function(){};

  if(typeof search !== 'string') {
    return callback(new Error('Search must be in string form'), null);
  }

  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + '/services/data/' + this.apiVersion + '/search';
  opts = { uri: uri, method: 'GET', qs: { q: search } }
  
  return this._apiRequest(opts, oauth, null, function(err, resp){
    if(!err) {
      if(resp.length) {
        var recs = [];
        for(var i=0; i<resp.length; i++) {
          recs.push(new Record(resp[i]));
        }
        resp = recs;
      }
    }
    callback(err, resp);
  });
}

Connection.prototype.getUrl = function(url, oauth, callback) {
  var uri, opts;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof url !== 'string') {
    return callback(new Error('Url must be in string form'), null);
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  uri = oauth.instance_url + url;
  opts = { uri: uri, method: 'GET' }
  
  return this._apiRequest(opts, oauth, null, callback);
}

// chatter api methods

// apex rest

Connection.prototype.apexRest = function(restRequest, oauth, callback) {
  var uri, opts, params, method;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }

  if(!callback) callback = function(){};

  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  if(typeof restRequest !== 'object') {
    return callback(new Error('You must specify a restRequest object'), null);
  }
  
  if(typeof restRequest.uri !== 'string') {
    return callback(new Error('You must specify a url with the type string'), null);
  }
  
  if(typeof restRequest.method === 'string' ) {
    method = restRequest.method;
    if(method !=='GET' && method !=='POST' && method !=='PATCH' && method !=='PUT')
    return callback(new Error('Only GET, POST, PATCH, & PUT are supported, you specified: '+ method), null);
  }
  //default to GET
  if(restRequest.method == null || typeof restRequest.method !== 'string'){
    restRequest.method = 'GET';
  }
  
  uri = oauth.instance_url + '/services/apexrest/' + restRequest.uri;
<<<<<<< HEAD
  opts = { uri: uri, method: restRequest.method};
  
  if(restRequest.body != null) {
    opts.body = JSON.stringify(restRequest.body);
=======
  opts = { uri: uri, method: restRequest.method }

  if(restRequest.body!=null) {
    opts.body = typeof restRequest.body === 'string' ? restRequest.body : JSON.stringify(restRequest.body);
>>>>>>> upstream/master
  }

  if(restRequest.urlParams != null) {
    if(!Array.isArray(restRequest.urlParams)) {
      return callback(new Error('URL parmams must be an array in form of [{key:\'key\', value:\'value\'}]'), null);
    }
    
    params = '?';
    
    for(i = 0; i<restRequest.urlParams.length; i++){
      if(i>0) params+= '&';
      params+=restRequest.urlParams[i].key+'='+restRequest.urlParams[i].value;
    }
    
    opts.uri+=params;
  }

  return this._apiRequest(opts, oauth, null, callback);
}

// streaming methods

Connection.prototype.stream = function(data, oauth) {
  var str, endpoint, client, sub;

  if(this.mode === 'single') {
    oauth = this.oauth;
  }

  str = new FDCStream();
  endpoint = oauth.instance_url + '/cometd/' + this.apiVersion.substring(1);
  
  client = new faye.Client(endpoint, {});
  client.setHeader('Authorization', 'OAuth ' + oauth.access_token);
  
  sub = client.subscribe('/topic/' + data, function(data){
    str.write(data);
  });
  
  sub.callback(function(){
    str.emit('connect');
  });
  
  sub.errback(function(error) {
    str.emit('error', error);
  });
  
  return str;
}

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

Connection.prototype.updatePassword = function(data, oauth, callback) {
  var type, opts, entity, name, id, fieldvalues;
  
  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  
  if(!callback) callback = function(){}
  
  if(typeof data.attributes.type !== 'string') {
    return callback(new Error('Type must be in the form of a string'), null);
  }
  
  type = data.attributes.type.toLowerCase();
  
  if(!(id = util.findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  fieldvalues = data.getFieldValues();
  
  if(typeof fieldvalues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  
  if(!util.validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  opts = { 
    uri: oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/User/' + id + '/password', 
    method: 'POST'
  };
  
  opts.body = JSON.stringify(fieldvalues);  
  return this._apiRequest(opts, oauth, data, callback);
}

<<<<<<< HEAD
//method for fetching ApexLogs
Connection.prototype.fetchLog = function(logId, oauth, callback) {
  var uri, opts, params, method;

  if(this.mode === 'single') {
    var args = Array.prototype.slice.call(arguments);
    oauth = this.oauth;
    if(args.length == 2) callback = args[1];
  }
  if(!callback) callback = function(){};
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  uri = oauth.instance_url + '/services/data/v28.0/sobjects/ApexLog/' + logId +'/Body';
  console.log(uri);
  opts = { uri: uri, method: 'GET'};
  return apiRequest(opts, oauth, null, callback);
}
// utility methods

var validateOAuth = function(oauth) {
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return false;
  } else {
    return true;
=======
var errors = {
  nonJsonResponse: function() {
    return new Error('Non-JSON response from Salesforce');
  },
  invalidJson: function() {
    return new Error('Invalid JSON response from Salesforce');
  },
  emptyResponse: function() {
    return new Error('Unexpected empty response');
>>>>>>> upstream/master
  }
}

Connection.prototype._apiAuthRequest = function(opts, callback) {

  var self = this;

  return request(opts, function(err, res, body){
    // request returned an error
    if(err) return callback(err);

    // request didn't return a response. sumptin bad happened
    if(!res) return callback(errors.emptyResponse());

    if(body && util.isJsonResponse(res)) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return callback(errors.invalidJson());
      }
    } else {
      return callback(errors.nonJsonResponse());
    }

    if(res.statusCode === 200) {
      // detect oauth response for single mode
      if(self.mode === 'single' && body.access_token) {
        self.oauth = body;
      }
      return callback(null, body);
    } else {
      var e = new Error(body.error + ' - ' + body.error_description);
      e.statusCode = res.statusCode;
      return callback(e, null);
    }

  });
}

Connection.prototype._apiBlobRequest = function(opts, oauth, callback) {

  var self = this;

  opts.headers = {
    'content-type': 'application/json',
    'Authorization': 'Bearer ' + oauth.access_token
  }

  return request(opts, function(err, res, body) {
    // request returned an error
    if(err) return callback(err, null);

    // request didn't return a response. sumptin bad happened
    if(!res) return callback(errors.emptyResponse());

    // salesforce returned no body but an error in the header
    if(!body && res.headers && res.headers.error) {
      return callback(new Error(res.headers.error), null);
    }

    // salesforce returned an ok of some sort
    if(res.statusCode >= 200 && res.statusCode <= 204) {
      return callback(null, body);
    } 

    // salesforce returned an error with a body
    if(body) {
      if(util.isJsonResponse(res)) {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return callback(errors.invalidJson());
        }

        if (Array.isArray(body) && body.length > 0) {
          err = new Error(body[0].message);
          err.errorCode = body[0].errorCode;
          err.messageBody = body[0].message;
        }
        else {
          //  didn't get a json response back -- just a simple string as the body
          err = new Error(body);
          err.messageBody = body;
        }
        err.statusCode = res.statusCode;
        return callback(err, null);
      } 
    } 
    
    // we don't know what happened
    return callback(new Error('Salesforce returned no body and status code ' + res.statusCode), null);

  });
}

Connection.prototype._apiRequest = function(opts, oauth, sobject, callback) {

  var self = this;

  opts.headers = {
    'Authorization': 'Bearer ' + oauth.access_token,
    'Accept': 'application/json;charset=UTF-8'
  }

  if(opts.multipart) {
    opts.headers['content-type'] = 'multipart/form-data';
  } else {
    opts.headers['content-type'] = 'application/json';
  }
  
  if(opts.method === 'GET' && this.gzip === true) {
    opts.headers['Accept-Encoding'] = 'gzip';
    opts.encoding = null;
    delete opts.gzip;
  }

  return request(opts, function(err, res, body) {
    
    // request returned an error
    if(err) return callback(err, null);

    // request didn't return a response. Sumptin bad happened
    if(!res) return callback(errors.emptyResponse());

    // salesforce returned no body but an error in the header
    if(!body && res.headers && res.headers.error) {
      return callback(new Error(res.headers.error), null);
    }

    var processResponse = function(data) {
      // attempt to parse the json now
      if(util.isJsonResponse(res)) {
        if(data) {
          try {
            data = JSON.parse(data);
          } catch (e) {
            return callback(errors.invalidJson());
          }
        }
      }

<<<<<<< HEAD
    // salesforce returned an error with a body
    if(body) {
      body = JSON.parse(body);
      err = new Error(body[0].message);
      err.errorCode = body[0].errorCode;
      err.statusCode = res.statusCode;
      err.messageBody = body[0].message;
      return callback(err, null);
    } 
    
    // we don't know what happened
    return callback(new Error('Salesforce returned no body and status code ' + res.statusCode), null);
=======
      // salesforce returned an ok of some sort
      if(res.statusCode >= 200 && res.statusCode <= 204) {
        // attach the id back to the sobject on insert
        if(sobject && data && data.id && !sobject.Id && !sobject.id && !sobject.ID) sobject.Id = data.id;
        return callback(null, data);
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
          e.messageBody = data;
        }
        e.statusCode = res.statusCode;
        return callback(e, null);
      }

      // we don't know what happened
      return callback(new Error('Salesforce returned no body and status code ' + res.statusCode));
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
>>>>>>> upstream/master

  });
}

// exports

<<<<<<< HEAD

=======
module.exports.util = util;

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
}

module.exports.plugin = function(opts) {
  if(typeof opts === 'string') {
    opts = { namespace: opts };
  }
  if(!opts || !opts.namespace) {
    throw new Error('no namespace provided for plugin')
  }

  opts = _.defaults(opts, {
    override: false
  });

  if(plugins[opts.namespace] && !opts.override === true) {
    throw new Error('a plugin with namespace ' + opts.namespace + ' already exists');
  }

  plugins[opts.namespace] = new Plugin(opts);

  return plugins[opts.namespace];

}

// connection creation
>>>>>>> upstream/master

module.exports.createConnection = function(opts) {
  return new Connection(opts);
}

module.exports.createSObject = function(type, fields) {
  var data = {
    attributes: {}
  }
  data.attributes.type = type;
  var rec = new Record(data);
  if(fields) {
    for(var key in fields) {
      rec[key] = fields[key];
    }
  }
  return rec;
}

<<<<<<< HEAD
// canvas signed request midddleware for express
module.exports.signed_request = function(options) {
 
  if(!options) options = {};
 
  return function(req, res, next) {
    if(req.method === 'POST' && req.body && req.body.signed_request) {
      if(!req.body.signed_request) next();
      //Split the signed request body in to two parts
      var signed_body = req.body.signed_request.split('.');
      //ensure that the signature and oauth are included
      if(signed_body.length !== 2) next();
      var signature = signed_body[0];
      var srData = JSON.parse(new Buffer(arr[1], 'base64').toString('ascii'));
      // build up our oauth object for nforce
      var oauth = {
        access_token: srData.client.oauthToken || '',
        instance_url: srData.client.instanceUrl || ''
      };
      // verify the signature
      var verify_signature= crypto.createHmac('sha256', this.clientSecret).update(signed_body[1]).digest('base64');
      if(verify_signature !== signature) next();

      // attach full signed request to request and, if available, session
      req.signed_request = srData;
      req.oauth = oauth;

      if(req.session){
        req.session.signed_request = srData;
        req.session.oauth = oauth;
      }       
      next();
    } else {
      next();
    }
  }
}

module.exports.Record = Record;
module.exports.version = require('./package.json').version;

