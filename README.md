nforce
======

[![Build Status](https://secure.travis-ci.org/kevinohara80/nforce.png)](http://travis-ci.org/kevinohara80/nforce)  

**nforce** is node.js a REST API wrapper for force.com, database.com, and salesforce.com.

## Features

* Simple api
* Helper oauth methods
* Express middleware
* Streaming queries

## Installation

```bash
$ npm install nforce
```

## Usage

Require **nforce** in your app and create a connection to an org.

```js
var nforce = require('nforce');

var org = nforce.createConnection({
  clientId: 'SOME_OAUTH_CLIENT_ID',
  clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  apiVersion: 'v24.0',  // optional, defaults to v24.0
  environment: 'production'  // optional, sandbox or production, production default
});
```

Now we just need to authenticate and get our OAuth credentials. Here is one way...

```js
var oauth;

org.authenticate({ username: 'my_test@gmail.com', password: 'mypassword'}, function(err, resp){
  if(!err) oauth = resp;
});
```

Now we can go nuts. **nforce** has an sObject factory method that creates records for you. Let's use that and insert a record...

```js
var acc = nforce.createSObject('Account');
acc.Name = 'Spiffy Cleaners';
acc.Phone = '800-555-2345';
acc.SLA__c = 'Gold';

org.insert(acc, oauth, function(err, resp){
  if(!err) console.log('It worked!');
});
```

Querying and updating records is super easy. **nforce** wraps API-queried records in a special object. The object caches field updates that you make to the record and allows you to pass the record directly into the update method without having to scrub out the unchanged fields. In the example below, only the Name and Industry fields will be sent in the update call despite the fact that the query returned other fields such as BillingCity and CreatedDate.

```js
var query = 'SELECT Id, Name, CreatedDate, BillingCity FROM Account WHERE Name = \'Spiffy Cleaners\' LIMIT 1';

org.query(query, oauth, function(err, resp){
  
  if(!err && resp.records) {
    
    var acc = resp.records[0];
    acc.Name = 'Really Spiffy Cleaners';
    acc.Industry = 'Cleaners';
    
    org.update(acc, oauth, function(err, resp){
      if(!err) console.log('It worked!');
    });
    
  } 
});
```

## Authentication

**nforce** supports two OAuth 2.0 flows, username/password and authorization code.

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

At the end of a successful authorization, you a returned an OAuth object for the user. Cache this object as it will be used for subsequent requests. This object contains your access token, endpoint, id, and other information. 

Why is this not automatically stored as a global variable? This is because you can have multiple users accessing your application and each user will have their own OAuth credentials from Salesforce. In this scenario, it makes the most sense to store these credentials in the users session or in some other data store. If you are using [express](https://github.com/visionmedia/express), **nforce** can take care of storing this for you (see below).

## Other Features

### Express Middleware

**nforce** has built-in support for [express](https://github.com/visionmedia/express) using the express/connect middleware system. The middleware handles the oauth callbacks for you. To use the middleware you must have sessions enabled in your express configuration.

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

### Query Streaming

The Salesforce query call in the REST API returns a 2000 record chunk at one time. The example below shows a normal query returning 2000 records only.

```js
// dataset of 50k records.
var query = 'SELECT Name, CreatedDate FROM Account ORDER BY CreatedDate DESC';
org.query(query, req.session.oauth, callback(err, resp) {
  if(!err) console.log(resp.records.length) // this will be 2000 max
});
```

The **nforce** query method returns a node stream. By calling the `pipe` method on this object, your query call will automatically start streaming ALL of the records from your query in 2000 record batches.

```js
// dataset of 50k records.
var query = 'SELECT Name, CreatedDate FROM Account ORDER BY CreatedDate DESC';
org.query(query, req.session.oauth).pipe(res); // streaming all 50k records
``` 

### Force.com Streaming API Support

**nforce** supports the Force.com Streaming API. Connecting to one of your PushTopics is easy using the EventEmitter interface.

```js
org.authenticate({ username: user, password: pass }, function(err, oauth) {
  
  if(err) return console.log(err);

  // subscribe to a pushtopic
  var str = org.stream('AllAccounts', oauth);

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

## nforce API

### Callbacks

Callbacks will always pass an optional error object, and a response object. The response object closely resemble the typical responses from the Salesforce REST API.

```js
callback(err, resp);
```

### createConnection(opts)

The createConnection method creates an *nforce* connection object. You need to supply some arguments including oauth information and some optional arguments for version and environment.

* `clientId`: Required. This is the OAuth client id
* `clientSecret`: Required. This is the OAuth client secret
* `redirectUri`: Required. This is the redirect URI for OAuth callbacks
* `apiVersion`: Optional. This is a number or string representing a valid REST API version. Default is v24.0.
* `environment`: Optional. Values can be 'production' or 'sandbox'. Default is production.
* `loginUri`: Optional. Used to override the login URI if needed.
* `testLoginUri`: Optional. Used to override the testLoginUri if needed.

### createSObject(type, [fieldValues])

This creates an sObject record that you can use to insert, update, upsert, and delete. `type` should be the API name of the sObject that you are updating. `fieldValues` should be a hash of field names and values that you want to initialize your sObject with. You can also just assign fields and values by setting properties after you create the sObject.

## sObject Methods

### getFieldValues()

This method shows the cached values that have been updated that will be passed in an update or upsert method

### setExternalId(field, value)

For upsert methods, you need to specify the External Id field and the value that you are trying to match on.

### getId()

Returns the sObjects Id (if set)

## Connection Methods

The following list of methods are available for an **nforce** connection object:

### getAuthUri()

This is a helper method to build the authentication uri for a authorization code OAuth 2.0 flow.

### authenticate(opts, callback)

This method requests the OAuth access token and instance information from Salesforce. This method either requires that you pass in the authorization code (authorization code flow) or username and password (username/password flow).

* `code`: (String) An OAuth authorization code

-- OR --

* `username`: (String) Your salesforce/force.com/database.com username
* `password`: (String) Your salesforce/force.com/database.com password
* `securityToken`: (String) Your Salesforce security token. This will be appended to your password if this property is set.

### expressOAuth(onSuccess, onError)

The express middleware. `onSuccess` and `onError` should be uri routes for redirection after OAuth callbacks.

### getVersions(callback)

Gets the salesforce versions. Note: Does not require authentication.

### getResources(oauth, callback)

Gets the available resources

### getSObjects(oauth, callback)

Get all sObjects for an org

### getMetadata(type, oauth, callback)

Get metadata for a single sObject. `type` is a required String for the sObject type

### getDescribe(type, oauth, callback)

Get describe information for a single sObject. `type` is a required String for the sObject type

### insert(sobject, oauth, callback)

Insert a record. `sobject`: (Object) A Salesforce sObject

### update(sobject, oauth, callback)

Update a record. `sobject`: (Object) A Salesforce sObject

### upsert(sobject, oauth, callback)

Update a record. `sobject`: (Object) A Salesforce sObject. NOTE: you must use the setExternalId() method to set the external Id field and the value to match on.

### delete(sobject, oauth, callback)

Delete a record. `sobject`: (Object) A Salesforce sObject

### getRecord(sobject, oauth, callback)

Get a single record. `sobject`: (Object) A Salesforce sObject

### query(query, oauth, [callback])

Execute a SOQL query for records. `query` should be a SOQL string. Large queries can be streamed using the `pipe()` method.

### search(search, oauth, callback)

Execute a SOSL search for records. `search` should be a SOSL string.

### getUrl(url, oauth, callback)

Get a REST API resource by its url. `url` should be a REST API resource.

### stream(pushtopic, oauth)

Start a streaming connection. An EventEmitter is returned with the following events:

* `connect`: subscribed to the topic
* `data`: got a streaming event
* `error`: there was a problem with the subscription

### apexRest(restRequest, oauth, callback)

This method handles integration with salesforce ApexRest (Custom Rest endpoints)
http://wiki.developerforce.com/page/Creating_REST_APIs_using_Apex_REST

A restRequest has the following properties

* `uri`: (String) REQUIRED - The endpoint you wrote (everything after services/apexrest/..)
* `method`: (String) Optional - defaults to GET if not supplied
* `body`: (Object || String) Optional - What you would like placed in the body of your request
* `urlParams`: (Array) Optional - URL parmams in an array of [{key:'key', value:'value'}]

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

* **nforce** cli implementation
* Blob data support
* User password management
* Continue with caching capabilities for describe/metadata calls
* Chatter support

## Contributors

* Kevin O'Hara -> [kevinohara80](https://github.com/kevinohara80)
* Jeff Douglas -> [jeffdonthemic](https://github.com/jeffdonthemic)
* Zach McElrath -> [zachelrath](https://github.com/zachelrath)
* Chris Bland -> [chrisbland](https://github.com/chrisbland)

## Changelog

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