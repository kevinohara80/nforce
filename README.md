nforce :: node.js salesforce REST API wrapper
======

[![Build Status](https://secure.travis-ci.org/kevinohara80/nforce.png)](http://travis-ci.org/kevinohara80/nforce)  

**nforce** is node.js a REST API wrapper for force.com, database.com, and salesforce.com.

**Notice:** [A lot of the API has changed in v0.7.0](https://gist.github.com/kevinohara80/8357088). Please take note of the new api changes in the readme if you are upgrading from < v0.7.

## Features

* Simple api
* Intelligent sObjects
* Helper OAuth methods
* Simple streaming
* Multi-user design with single user mode
* Express middleware
* Plugin support

## Installation

```bash
$ npm install nforce
```

## Usage

Require **nforce** in your app and create a client connection to a Salesforce Remote Access Application.

```js
var nforce = require('nforce');

var org = nforce.createConnection({
  clientId: 'SOME_OAUTH_CLIENT_ID',
  clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  apiVersion: 'v27.0',  // optional, defaults to current salesforce API version
  environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
  mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
});
```

Now we just need to authenticate and get our salesforce OAuth credentials. Here is one way to do this in multi-user mode...

```js
// multi user mode
var oauth;
org.authenticate({ username: 'my_test@gmail.com', password: 'mypassword'}, function(err, resp){
  // store the oauth object for this user
  if(!err) oauth = resp;
});
```

...or in single-user mode...

```js
// single-user mode
org.authenticate({ username: 'my_test@gmail.com', password: 'mypassword'}, function(err, resp){
  // the oauth object was stored in the connection object
  if(!err) console.log('Cached Token: ' + org.oauth.access_token)
});
```

Now we can go nuts. **nforce** has an salesforce sObject factory method that creates records for you. Let's use that and insert a record...

```js
var acc = nforce.createSObject('Account');
acc.set('Name', 'Spiffy Cleaners');
acc.set('Phone', '800-555-2345');
acc.set('SLA__c', 'Gold');

org.insert({ sobject: acc, oauth: oauth }, function(err, resp){
  if(!err) console.log('It worked!');
});
```

If you are in single-user mode, the `oauth` argument can be ommitted since it's cached as part of your connection object.

```js
org.insert({ sobject: acc }, function(err, resp){
  if(!err) console.log('It worked!');
});
```

Querying and updating records is super easy. **nforce** wraps API-queried records in a special object. The object caches field updates that you make to the record and allows you to pass the record directly into the update method without having to scrub out the unchanged fields. In the example below, only the Name and Industry fields will be sent in the update call despite the fact that the query returned other fields such as BillingCity and CreatedDate.

```js
var q = 'SELECT Id, Name, CreatedDate, BillingCity FROM Account WHERE Name = "Spiffy Cleaners" LIMIT 1';

org.query({ query: q }, function(err, resp){
  
  if(!err && resp.records) {
    
    var acc = resp.records[0];
    acc.set('Name', 'Really Spiffy Cleaners');
    acc.set('Industry', 'Cleaners');
    
    org.update({ sobject: acc, oauth: oauth }, function(err, resp){
      if(!err) console.log('It worked!');
    });
    
  } 
});
```

## Using the Example Files

Most of the files in the examples directory can be used by simply setting two environment variables then running the files. The two environment variables are `SFUSER` and `SFPASS` which are your Salesforce.com username and passsword, respectively. Example below:

```bash 
$ export SFUSER=myusername@salesforce.com
$ export SFPASS=mypassword
$ node examples/crud.js
```

## Authentication

**nforce** supports two Salesforce OAuth 2.0 flows, username/password and authorization code. 

### Username/Password flow

To request an access token and other oauth information using the username and password flow, use the `authenticate()` method and pass in your username and password in the options

```js
var oauth;

org.authenticate({ username: 'my_test@gmail.com', password: 'mypassword'}, function(err, resp){
  if(!err) {
    console.log('Access Token: ' + resp.access_token);
    oauth = resp;
  } else {
    console.log('Error: ' + err.message);
  }
});
```

### Authorization Code Flow

To perform an authorization code flow, first redirect users to the Authorization URI at Salesforce. **nforce** provides a helper function to build this url for you.

```js
org.getAuthUri()
```

Once you get a callback at the Redirect URI that you specify, you need to request your access token and other important oauth information by calling `authenticate()` and passing in the "code" that you received.

```js
var oauth;

org.authenticate({ code: 'SOMEOAUTHAUTHORIZATIONCODE' }, function(err, resp){
  if(!err) {
    console.log('Access Token: ' + resp.access_token);
    oauth = resp;
  } else {
    console.log('Error: ' + err.message);
  }
});
```

### OAuth Object

At the end of a successful authorization, you a returned an OAuth object for the user. This object contains your salesforce access token, endpoint, id, and other information.  If you have `mode` set to `multi`, cache this object for the user as it will be used for subsequent requests. If you are in `single` user mode, the OAuth object is stored as a property on your salesforce connection object.

### OAuth Object De-Coupling (Multi-user mode)

**nforce** decouples the oauth credentials from the connection object when `mode` is set to `multi` so that in a multi-user situation, a separate connection object doesn't need to be created for each user. This makes the module more efficient. Essentially, you only need one connection object for multiple users and pass the OAuth object in with the request. In this scenario, it makes the most sense to store the OAuth credentials in the users session or in some other data store. If you are using [express](https://github.com/visionmedia/express), **nforce** can take care of storing this for you (see Express Middleware).

### Integrated OAuth Object (Single-user mode)

If you specified `single` as your `mode` when creating the connection, calling authenticate will store the OAuth object within the connection object. Then, in subsequent API requests, you can simply omit the OAuth object from the request like so.

```js
// look ma, no oauth argument!
org.query({ query: 'SELECT Id FROM Lead LIMIT 1' }, function(err, res) {
  if(err) return console.error(err);
  else return console.log(res.records[0]);
});
```

## Other Features

### Express Middleware

**nforce** has built-in support for [express](https://github.com/visionmedia/express) using the express/connect middleware system. The middleware handles the oauth callbacks for you and automatically stores the OAuth credentials in the user's session. Therefore, to use the middleware you must have sessions enabled in your express configuration.

```js
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'nforce testing baby' }));
  app.use(org.expressOAuth({onSuccess: '/home', onError: '/oauth/error'}));  // <--- nforce middleware
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
```

Once this OAuth flow completes, subsequent requests just need to retrieve the OAuth requests from the user's session. Having this OAuth data in the session is quite handy.

```js
// express route
app.get('ajax/cases', function(req, res) { 
  var q = 'SELECT Id, CaseNumber FROM Cases WHERE IsClosed = false';
  org.query({ query:q, oauth: req.session.oauth }).pipe(res);
});
```

### Streaming API Responses

Under the covers, **nforce** leverages [request](https://github.com/mikeal/request) for all http requests to the Salesforce REST API. **request** returns a readable stream that can be used to pipe the data to a writable stream.

Here is an example of piping an nforce api request for the binary data of an Attachment directly to the response object in an http server.

```js
var http = require('http');

var server = http.createServer(function(req, res) {
  if(req.url === '/myimage') {
    org.getAttachmentBody({ id: attId, oauth: oauth }).pipe(res);
  } else {
    res.statusCode = 404;
    res.end();
  }
});
```

Here is an example of how you could get all sobjects in an org and write directly to a file in the local file system.

```js
var fs = require('fs');

org.getSObjects(oauth).pipe(fs.createWriteStream('./sobjects.txt'));
```

### Query Streaming

The Salesforce query call in the REST API returns a 2000 record chunk at one time. The example below shows a normal query returning 2000 records only.

```js
// dataset of 50k records.
var query = 'SELECT Name, CreatedDate FROM Account ORDER BY CreatedDate DESC';
org.query({ query: query, oauth: req.session.oauth }, callback(err, resp) {
  if(!err) console.log(resp.records.length) // this will be 2000 max
});
```

Like other API requests, **nforce** query method returns a node stream. By calling the `pipe` method on this object, your query call will automatically start streaming ALL of the records from your query in 2000 record batches.

```js
// dataset of 50k records.
var query = 'SELECT Name, CreatedDate FROM Account ORDER BY CreatedDate DESC';
org.query({query: query, oauth: req.session.oauth }).pipe(res); // streaming all 50k records
``` 

### Force.com Streaming API Support

**nforce** supports the Force.com Streaming API. Connecting to one of your PushTopics is easy using the node.js EventEmitter interface.

```js
org.authenticate({ username: user, password: pass }, function(err, oauth) {
  
  if(err) return console.log(err);

  // subscribe to a pushtopic
  var str = org.stream({ topic: 'AllAccounts', oauth: oauth });

  str.on('connect', function(){
    console.log('connected to pushtopic');
  });

  str.on('error', function(error) {
    console.log('error: ' + error);
  });

  str.on('data', function(data) {
    console.log(data);
  });

});
```

### Plugins

As of **nforce** v0.7.0, a plugin API is now exposed so that the capabilities of nforce can easily be extended. This plugin system also allows the core of nforce to remain small, handling mostly authentication, CRUD, query, search, and other basic API requests. As Salesforce releases additional API's or as authors find interesting ways to extend nforce, these can easily be built into plugins and added to your nforce configuration as-needed. 

To use plugins in your application, you'll need to load them into nforce and specify which plugins to use when creating a connection object. Here is an example.

```js
var nforce = require('nforce');

// load the plugin
require('myplugin')(nforce);

var org = nforce.createConnection({
  clientId:     process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/oauth/_callback',
  plugins:     ['myplugin'] // make sure you enable it when creating a connection
});

org.myplugin.getSomeData(function(err, data) {
  console.log(data);
});
```

You'll notice that the plugins methods are all namespaced. This is to prevent method naming conflicts between plugins. As a best-practice, plugin authors should make their namespace the same as the module name but it's best to refer to their documentation for the exact namespace when using their plugin.

Documentation on authoring plugins is coming soon...

## nforce API Basics

### Callbacks

The API of **nforce** follows typical node.js standards. Callbacks will always pass an optional error object, and a response object. The response object closely resembles the typical responses from the Salesforce REST API.

```js
callback(err, resp);
```

### Streams

Most of the org methods take a callback, but also return a stream. This is useful if you want to **pipe** stuff around. Here is a quick example of how you could dump all sobjects in an org to a file.

```js
var so = fs.createWriteStream('sobjects.txt', {'flags': 'a'});

org.getSObjects({ oauth: oauth }).pipe(so);  
```

## nforce Base Methods

### createConnection(opts)

The createConnection method creates an *nforce* salesforce connection object. You need to supply some arguments including oauth information and some optional arguments for version and salesforce environment type. 

* `clientId`: Required. This is the OAuth client id
* `clientSecret`: Required. This is the OAuth client secret
* `redirectUri`: Required. This is the redirect URI for OAuth callbacks
* `apiVersion`: Optional. This is a number or string representing a valid REST API version. Default is the latest current api version.
* `environment`: Optional. Values can be 'production' or 'sandbox'. Default is production.
* `loginUri`: Optional. Used to override the login URI if needed.
* `testLoginUri`: Optional. Used to override the testLoginUri if needed.
* `gzip`: Optional. If set to boolean 'true', then *nforce* will request that salesforce compress responses (using gzip) before transmitting over-the-wire.

### createSObject(type, [fieldValues])

This creates an sObject record that you can use to insert, update, upsert, and delete. `type` should be the salesforce API name of the sObject that you are updating. `fieldValues` should be a hash of field names and values that you want to initialize your sObject with. You can also just assign fields and values by setting properties after you create the sObject.

## plugin(namespace|opts)

This creates an nforce plugin. Plugins allow you to extend the functionality of nforce. You need to initialize the plugin with a `namespace` or an options hash containing a namespace. Valid options include:

* `namespace`: Required. This sets the namespace for your plugin
* `override`: Override *true* allows you to overwrite an existing plugin. Default is false.

## Salesforce sObject Methods

### get(field)

Get the value of a field on the sObject

### set(field, value) OR set(hash)

Set the value of a single field (field, value) or set multiple fields using a hash.

### getId()

Get the Id of the sObject

### setId(id)

Set the Id of the sObject

### getType()

Returns the sObject type in lowercase

### isType(type)

Checks the type of the sObject and returns true|false

### getExternalId()

Returns the external id that is currently set

### getExternalIdField()

Returns the external id field that is currently set

### setExternalId(field, value)

For upsert methods, you need to specify the External Id field and the value that you are trying to match on.

### getAttachment()

Returns the attachment object if set

### setAttachement(fileName, body)

Sets the fileName (String) and body (buffer) for an attachment

### getFileName()

Returns the file name of the attachment if set

### setFileName(fileName) 

Sets the file name of the attachment

### getBody

Gets the body of the attachment if set

### setBody

Sets the body of the attachment

### hasChanged(field)

Checks to see if the field has been changed since the last save on the server

### changed()

Returns a hash of the changed fields and their current values

### previous()

Returns a hash of the previous values for changed fields

### toJSON()

Returns a JSON representation of the fields in the sObject

## Connection Methods

The following list of methods are available for an **nforce** connection object:

### getAuthUri([opts])

This is a helper method to build the authentication uri for a authorization code OAuth 2.0 flow. You can optionally pass in an OAuth options argument. The supported options are:

* `display`: (String) Tailors the login page to the user's device type. Currently the only values supported are `page`, `popup`, and `touch`
* `immediate`: (Boolean) Avoid interacting with the user. Default is false.
* `scope`: (Array) The scope parameter allows you to fine-tune what the client application can access. Supported values are `api`, `chatter_api`, `full`, `id`, `refresh_token`, `visualforce`, and `web` 
* `state`: Any value that you wish to be sent with the callback

### authenticate(opts, [callback])

This method requests the OAuth access token and instance information from Salesforce or Force.com. This method either requires that you pass in the authorization code (authorization code flow) or username and password (username/password flow).

* `code`: (String) An OAuth authorization code

-- OR --

* `username`: (String) Your salesforce/force.com/database.com username
* `password`: (String) Your salesforce/force.com/database.com password
* `securityToken`: (String) Your Salesforce security token. This will be appended to your password if this property is set.

### refreshToken(opts, callback)

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode

### revokeToken(opts, callback)

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `token`: (Required) The oauth access_token or refresh_token you want to revoke

### expressOAuth(onSuccess, onError)

The express middleware. `onSuccess` and `onError` should be uri routes for redirection after OAuth callbacks.

### getVersions([callback])

Gets the salesforce versions. Note: Does not require authentication.

### getResources(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode

Gets the available salesforce resources

### getSObjects(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode

Get all sObjects for an org

### getMetadata(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `type`: (Required) The metadata type that is being requested

Get metadata for a single sObject. `type` is a required String for the sObject type

### getDescribe(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `type`: (Required) The metadata type that is being requested

Get describe information for a single sObject. `type` is a required String for the sObject type

### insert(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Required) An sObject instance

Insert a record. 

### update(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Required) An sObject instance

Update a record.

### upsert(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Required) An sObject instance

Update a record. NOTE: you must use the setExternalId() method to set the external Id field and the value to match on.

### delete(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Required) An sObject instance

Delete a record.

### getRecord(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Optional) An sObject instance.
* `fields`: (Optional) An array of fields to return
* `type:`: (Optional) A string value sObject type
* `id`: (Optional) A string value for the sObject record id

Get a single record. You must supply either an `sobject` or `type` and `id`

### getBody(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Optional) An sObject instance.
* `type:`: (Optional) A string value sObject type
* `id`: (Optional) A string value for the sObject record id

Get the binary data for an attachment, document, or contentversion. You must supply either an `sobject` or `type` and `id`. The `sobject` must be one of those three types.

### getAttachmentBody(opts, [callback]) 

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Optional) An sObject instance.
* `id`: (Optional) A string value for the sObject record id

Get the binary data for an attachment. You must supply either an `sobject` or an `id`.

### getDocumentBody(id, [oauth], [callback]) 

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Optional) An sObject instance.
* `id`: (Optional) A string value for the sObject record id

Get the binary data for a document. You must supply either an `sobject` or an `id`.

### getContentVersionBody(id, [oauth], [callback]) 

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `sobject`: (Optional) An sObject instance.
* `id`: (Optional) A string value for the sObject record id

Get the binary data for a contentversion. You must supply either an `sobject` or an `id`.

### query(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `query`: (Required) An query string

Execute a SOQL query for records.

### queryAll(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `query`: (Required) An query string

Same as query but includes deleted records

### search(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `search`: (Required) An search string

Execute a SOSL search for records. `search` should be a SOSL string.

### getUrl(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `url`: (Required) An url string for an api resource

Get a REST API resource by its url. 

### stream(opts)

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `topic`: (Required) An string value for the streaming topic

Start a force.com streaming API connection. An EventEmitter is returned with the following events:

* `connect`: subscribed to the topic
* `data`: got a streaming event
* `error`: there was a problem with the subscription

### apexRest(opts, [callback])

opts:

* `oauth`: (Optional) The oauth object. Required in multi-user mode
* `uri`: (Required) A string value for endpoint
* `method`: (Optional) String method that defaults to GET if not supplied
* `urlParams:` (Optional) A hash or url params to add to the request

This method handles integration with salesforce ApexRest (Custom Rest endpoints)
http://wiki.developerforce.com/page/Creating_REST_APIs_using_Apex_REST

```js
org.apexRest({uri:'test', method: 'POST', body: body, urlParams: urlParams}, req.session.oauth, function(err,resp){
  if(!err) {
    console.log(resp);
    res.send(resp);
  }else{
    console.log(err);
    res.send(err);
  }
})
```

## Todo

* Move express middleware to a separate module

## Contributors

* Kevin O'Hara -> [kevinohara80](https://github.com/kevinohara80)
* Jeff Douglas -> [jeffdonthemic](https://github.com/jeffdonthemic)
* Zach McElrath -> [zachelrath](https://github.com/zachelrath)
* Chris Bland -> [chrisbland](https://github.com/chrisbland)
* Jeremy Neander -> [jneander](https://github.com/jneander)
* Austin McDaniel -> [amcdaniel2](https://github.com/amcdaniel2)
* Chris Hickman -> [chrishic](https://github.com/chrishic)
* Daniel -> [bitbay](https://github.com/bitbay)
* Gonzalo Huerta-Canepa -> [gfhuertac](https://github.com/gfhuertac)
* Kyle Bowerman -> [kbowerma](https://github.com/kbowerma)
* Matt Sergeant -> [baudehlo](https://github.com/baudehlo)
* Scott Anson -> [scottanson](https://github.com/scottanson)
* Derek Hansen -> [derekhansen](https://github.com/derekhansen)
* deedw -> [deedw](https://github.com/deedw)

## Changelog

* `v0.7.0`: Major api changes. Plugin system. sObject record class improvements
* `v0.6.2`: Fixes issue for single user mode and invalid oauth
* `v0.6.1`: Security fix for client secret in auth uri
* `v0.6.0`: Support for queryAll
* `v0.5.3`: API version 29 support
* `v0.5.2`: Fixed Apex REST bug because Jeff Douglas demanded it.
* `v0.5.1`: Fix a bug in getVersions for single user mode
* `v0.5.0`: Safer error handling. OAuth extra param support.
* `v0.4.4`: Fixes query stream issues
* `v0.4.3`: Fix express oauth issue. Whoops, my bad!
* `v0.4.2`: Fix for upsert issue
* `v0.4.1`: Bug fix for handling SFDC 500 response
* `v0.4.0`: Single user mode
* `v0.3.1`: Documentation updates.
* `v0.3.0`: Blob support. API request streaming.
* `v0.2.5`: Patches for Apex Rest
* `v0.2.4`: Small bug fixes
* `v0.2.3`: Apex Rest support
* `v0.2.2`: Added loginUri override support
* `v0.2.1`: API version bump
* `v0.2.0`: Adding streaming support
* `v0.1.1`: Fixes auth error handling bug
* `v0.1.0`: Releasing 0.1.0!
* `v0.0.7`: Bug fixes
* `v0.0.6`: Query streaming
* `v0.0.5`: Bug fixes
* `v0.0.4`: Initialization of SObject now has field setting option
* `v0.0.3`: API overhaul. Implemented Record class with field update caching
* `v0.0.2`: Testing framework implemented. Bug fixes.
* `v0.0.1`: Initial release. OAuth, CRUD, describes