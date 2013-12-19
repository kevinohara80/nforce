// module dependencies

var request     = require('request');
var qs          = require('querystring');
var url         = require('url');
var Record      = require('./lib/record');
var QueryStream = require('./lib/querystream');
var FDCStream   = require('./lib/fdcstream');
var faye        = require('faye');
var mime        = require('mime');

// constants

var AUTH_ENDPOINT      = 'https://login.salesforce.com/services/oauth2/authorize';
var TEST_AUTH_ENDPOINT = 'https://test.salesforce.com/services/oauth2/authorize';
var LOGIN_URI          = 'https://login.salesforce.com/services/oauth2/token';
var TEST_LOGIN_URI     = 'https://test.salesforce.com/services/oauth2/token';
var API_VERSIONS       = ['v20.0', 'v21.0', 'v22.0', 'v23.0', 'v24.0', 'v25.0', 'v26.0', 'v27.0', 'v28.0', 'v29.0'];

// nforce connection object

var Connection = function(opts) {
  if(!opts) opts = {};
  if(!opts.clientId  || typeof opts.clientId !== 'string') {
    throw new Error('Invalid or missing clientId');
  } else {
    this.clientId = opts.clientId;
  }
  if(!opts.clientSecret || typeof opts.clientSecret !== 'string') {
    throw new Error('Invalid or missing clientSecret');
  } else {
    this.clientSecret = opts.clientSecret;
  }
  if(!opts.redirectUri || typeof opts.redirectUri !== 'string') {
    throw new Error('Invalid or missing redirectUri');
  } else {
    this.redirectUri = opts.redirectUri;
  }
  // Allow custom login and test uris to be passed in
  // Addresses issue #5
  // @zachelrath 11/13/12
  opts.loginUri && (LOGIN_URI = opts.loginUri);
  opts.testLoginUri && (TEST_LOGIN_URI = opts.testLoginUri);

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
    this.apiVersion = API_VERSIONS[API_VERSIONS.length - 1];
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
  if(opts.mode && opts.mode.toLowerCase() === 'single') {
    this.mode = 'single';
  } else {
    this.mode = 'multi';
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

  uri = (self.environment == 'sandbox') ? TEST_LOGIN_URI : LOGIN_URI;

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

  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  if(!oauth.refresh_token) return callback(new Error('You must supply a refresh token'));

  bodyOpts = {
    'client_id': self.clientId,
    'client_secret': self.clientSecret,
    'grant_type': 'refresh_token',
    'redirect_uri': self.redirectUri,
    'refresh_token': oauth.refresh_token
  }

  uri = (self.environment == 'sandbox') ? TEST_LOGIN_URI : LOGIN_URI;

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
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!(id = findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  fieldvalues = data.getFieldValues();
  
  if(typeof fieldvalues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!(id = findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!(id = findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  opts = { uri: uri, method: 'GET'}
  
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
  
  if(!(id = findId(data))) {
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
  
  if(typeof id === 'object') id = findId(id);
  
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
  
  if(typeof id === 'object') id = findId(id);
  
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

  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);

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

  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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

  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
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
  if(restRequest.method==null || typeof restRequest.method !== 'string'){
    restRequest.method = 'GET';
  }
  
  uri = oauth.instance_url + '/services/apexrest/' + restRequest.uri;
  opts = { uri: uri, method: restRequest.method}
  
  if(restRequest.body!=null) {
    opts.body = typeof restRequest.body === 'string' ? restRequest.body : JSON.stringify(restRequest.body);
  }

  if(restRequest.urlParams!=null) {
    if(!Array.isArray(restRequest.urlParams)) {
      return callback(new Error('URL parmams must be an array in form of [{key:\'key\', value:\'value\'}]'), null);
    }
    
    params = '?';
    
    for(i = 0; i<restRequest.urlParams.length; i++){
      if(i>0) params+='&'
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
  
  if(!(id = findId(data))) {
    return callback(new Error('You must specify an id in the form of a string'));
  }
  
  fieldvalues = data.getFieldValues();
  
  if(typeof fieldvalues !== 'object') {
    return callback(new Error('fieldValues must be in the form of an object'), null);
  }
  
  if(!validateOAuth(oauth)) return callback(new Error('Invalid oauth object argument'), null);
  
  opts = { 
    uri: oauth.instance_url + '/services/data/' + this.apiVersion + '/sobjects/User/' + id + '/password', 
    method: 'POST'
  };
  
  opts.body = JSON.stringify(fieldvalues);  
  return this._apiRequest(opts, oauth, data, callback);
}

// utility methods

var validateOAuth = function(oauth) {
  if(!oauth || !oauth.instance_url || !oauth.access_token) {
    return false;
  } else {
    return true;
  }
}

var findId = function(data) {
  if(data.getId && typeof data.getId === 'function') {
    return data.getId();
  } else if(data.Id) {
    return data.Id
  } if(data.id) {
    return data.id;
  } else if(data.ID) {
    return data.ID;
  }
}

var isJsonResponse = function(res) {
  return res.headers && res.headers['content-type'] 
    && res.headers['content-type'].split(';')[0].toLowerCase() === 'application/json';
}

var errors = {
  nonJsonResponse: function() {
    return new Error('Non-JSON response from Salesforce');
  },
  invalidJson: function() {
    return new Error('Invalid JSON response from Salesforce');
  },
  emptyResponse: function() {
    return new Error('Unexpected empty response');
  }
}

Connection.prototype._apiAuthRequest = function(opts, callback) {

  var self = this;

  return request(opts, function(err, res, body){
    // request returned an error
    if(err) return callback(err);

    // request didn't return a response. sumptin bad happened
    if(!res) return callback(errors.emptyResponse());

    if(body && isJsonResponse(res)) {
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
      if(isJsonResponse(res)) {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return callback(errors.invalidJson());
        }
        err = new Error(body[0].message);
        err.errorCode = body[0].errorCode;
        err.statusCode = res.statusCode;
        err.messageBody = body[0].message;
        return callback(err, null);
      } 
    } 
    
    // we don't know what happened
    return callback(new Error('Salesforce returned no body and status code ' + res.statusCode));

  });
}

Connection.prototype._apiRequest = function(opts, oauth, sobject, callback) {

  opts.headers = {
    'Authorization': 'Bearer ' + oauth.access_token,
    'Accept': 'application/json;charset=UTF-8'
  }

  if(opts.multipart) {
    opts.headers['content-type'] = 'multipart/form-data';
  } else {
    opts.headers['content-type'] = 'application/json';
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

    // attempt to parse the json now
    if(isJsonResponse(res)) {
      if(body) {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return callback(errors.invalidJson());
        }
      }
    } 

    // salesforce returned an ok of some sort
    if(res.statusCode >= 200 && res.statusCode <= 204) {
      // attach the id back to the sobject on insert
      if(sobject && body && body.id && !sobject.Id && !sobject.id && !sobject.ID) sobject.Id = body.id;
      return callback(null, body);
    } 

    // salesforce returned an error with a body
    if(body) {
      var e = new Error(body[0].message)
      e.errorCode = body[0].errorCode;
      e.statusCode = res.statusCode;
      e.messageBody = body[0].message;
      return callback(e, null);
    } 
    
    // we don't know what happened
    return callback(new Error('Salesforce returned no body and status code ' + res.statusCode));

  });
}

// exports

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

module.exports.Record = Record;
module.exports.version = require('./package.json').version;
