nforce :: node.js salesforce REST API wrapper
======

[![Build Status](https://secure.travis-ci.org/kevinohara80/nforce.png)](http://travis-ci.org/kevinohara80/nforce)  

**nforce** is node.js a REST API wrapper for force.com, database.com, and salesforce.com.

## Features

* Simple api
* Intelligent sObjects
* Helper OAuth methods
* Simple streaming
* Multi-user design with single user mode
* Express middleware

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
acc.Name = 'Spiffy Cleaners';
acc.Phone = '800-555-2345';
acc.SLA__c = 'Gold';

org.insert(acc, oauth, function(err, resp){
  if(!err) console.log('It worked!');
});
```

If you are in single-user mode, the `oauth` argument can be ommitted since it's cached as part of your connection object.

```js
org.insert(acc, function(err, resp){
  if(!err) console.log('It worked!');
});
```

Querying and updating records is super easy. **nforce** wraps API-queried records in a special object. The object caches field updates that you make to the record and allows you to pass the record directly into the update method without having to scrub out the unchanged fields. In the example below, only the Name and Industry fields will be sent in the update call despite the fact that the query returned other fields such as BillingCity and CreatedDate.

```js
var q = 'SELECT Id, Name, CreatedDate, BillingCity FROM Account WHERE Name = "Spiffy Cleaners" LIMIT 1';

org.query(q, oauth, function(err, resp){
  
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
org.query('SELECT Id FROM Lead LIMIT 1', function(err, res) {
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
  org.query(q, req.session.oauth).pipe(res);
});
```

### Streaming API Responses

Under the covers, **nforce** leverages [request](https://github.com/mikeal/request) for all http requests to the Salesforce REST API. **request** returns a readable stream that can be used to pipe the data to a writable stream.

Here is an example of piping an nforce api request for the binary data of an Attachment directly to the response object in an http server.

```js
var http = require('http');

var server = http.createServer(function(req, res) {
  if(req.url === '/myimage') {
    org.getAttachmentBody({ id: attId }, oauth).pipe(res);
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
org.query(query, req.session.oauth, callback(err, resp) {
  if(!err) console.log(resp.records.length) // this will be 2000 max
});
```

Like other API requests, **nforce** query method returns a node stream. By calling the `pipe` method on this object, your query call will automatically start streaming ALL of the records from your query in 2000 record batches.

```js
// dataset of 50k records.
var query = 'SELECT Name, CreatedDate FROM Account ORDER BY CreatedDate DESC';
org.query(query, req.session.oauth).pipe(res); // streaming all 50k records
``` 

### Force.com Streaming API Support

**nforce** supports the Force.com Streaming API. Connecting to one of your PushTopics is easy using the node.js EventEmitter interface.

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

org.getSObjects(oauth).pipe(so);  
```

## nforce Base Methods

### createConnection(opts)

The createConnection method creates an *nforce* salesforce connection object. You need to supply some arguments including oauth information and some optional arguments for version and salesforce environment type. 

* `clientId`: Required. This is the OAuth client id
* `clientSecret`: Required. This is the OAuth client secret
* `redirectUri`: Required. This is the redirect URI for OAuth callbacks
* `apiVersion`: Optional. This is a number or string representing a valid REST API version. Default is v24.0.
* `environment`: Optional. Values can be 'production' or 'sandbox'. Default is production.
* `loginUri`: Optional. Used to override the login URI if needed.
* `testLoginUri`: Optional. Used to override the testLoginUri if needed.

### createSObject(type, [fieldValues])

This creates an sObject record that you can use to insert, update, upsert, and delete. `type` should be the salesforce API name of the sObject that you are updating. `fieldValues` should be a hash of field names and values that you want to initialize your sObject with. You can also just assign fields and values by setting properties after you create the sObject.

## Salesforce sObject Methods

### getFieldValues()

This method returns the cached values that have been updated that will be passed in an update or upsert method. Calling this method clears the cache. It's very rare that you will need to call this method directly.

### setExternalId(field, value)

For upsert methods, you need to specify the External Id field and the value that you are trying to match on.

### getId()

Returns the sObjects Id (if set)

## Connection Methods

The following list of methods are available for an **nforce** connection object:

### getAuthUri()

This is a helper method to build the authentication uri for a authorization code OAuth 2.0 flow.

### authenticate(opts, [callback])

This method requests the OAuth access token and instance information from Salesforce or Force.com. This method either requires that you pass in the authorization code (authorization code flow) or username and password (username/password flow).

* `code`: (String) An OAuth authorization code

-- OR --

* `username`: (String) Your salesforce/force.com/database.com username
* `password`: (String) Your salesforce/force.com/database.com password
* `securityToken`: (String) Your Salesforce security token. This will be appended to your password if this property is set.

### expressOAuth(onSuccess, onError)

The express middleware. `onSuccess` and `onError` should be uri routes for redirection after OAuth callbacks.

### getVersions([callback])

Gets the salesforce versions. Note: Does not require authentication.

### getResources([oauth], [callback])

Gets the available salesforce resources

### getSObjects([oauth], [callback])

Get all sObjects for an org

### getMetadata(type, [oauth], [callback])

Get metadata for a single sObject. `type` is a required String for the sObject type

### getDescribe(type, [oauth], [callback])

Get describe information for a single sObject. `type` is a required String for the sObject type

### insert(sobject, [oauth], [callback])

Insert a record. `sobject`: (Object) A Salesforce sObject

### update(sobject, [oauth], [callback])

Update a record. `sobject`: (Object) A Salesforce sObject

### upsert(sobject, [oauth], [callback])

Update a record. `sobject`: (Object) A Salesforce sObject. NOTE: you must use the setExternalId() method to set the external Id field and the value to match on.

### delete(sobject, [oauth], [callback])

Delete a record. `sobject`: (Object) A Salesforce sObject

### getRecord(sobject, [oauth], [callback])

Get a single record. `sobject`: (Object) A Salesforce sObject

### getBody(sobject, [oauth], [callback])

Get the binary data for an attachment, document, or contentversion. The `sobject` must be one of those three types.

### getAttachmentBody(id, [oauth], [callback]) 

Get the binary data for an attachment for the given `id`

### getDocumentBody(id, [oauth], [callback]) 

Get the binary data for an document for the given `id`

### getContentVersionBody(id, [oauth], [callback]) 

Get the binary data for an contentversion for the given `id`

### query(query, [oauth], [callback])

Execute a SOQL query for records. `query` should be a SOQL string. Large queries can be streamed using the `pipe()` method.

### search(search, [oauth], [callback])

Execute a SOSL search for records. `search` should be a SOSL string.

### getUrl(url, [oauth], [callback])

Get a REST API resource by its url. `url` should be a REST API resource.

### stream(pushtopic, [oauth])

Start a force.com streaming API connection. An EventEmitter is returned with the following events:

* `connect`: subscribed to the topic
* `data`: got a streaming event
* `error`: there was a problem with the subscription

### apexRest(restRequest, [oauth], [callback])

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

## Chatter API Specific


The following is a list of methods which are related to Chatter APIs :

### postFeedItem(oauth,messageSegments,userId,callback)
Posts a feed Item to the User represented by `userId`.

### addCommentsToFeedById(oauth,messageSegments,feedItemId,callback)
Posts a feed Item to the User represented by `userId`. 
`messagesegments` is an array which looks something like this. 

```
var messageSegments = [{'type':'Text','text':'This is a message from chatter-APIs node lib.'}]
```

### mentionUserInFeedItem(oauth,messageSegments,userId,callback)
Metntions a user represented by `userId` in a feed.

`messagesegments` is an array which looks something like this. 

```
var messageSegments = [{'type':'Text','text':comments},{'type':'mention','id':userId}]
```

### mentionUserInComments(oauth,messageSegments,feedItemId,callback) 
Metntions a user represented by `userId` in a feed which is represented by `feedItemId`
userId is sent in `messagesegments`. 

```
var messageSegments = [{'type':'Text','text':comments},{'type':'mention','id':userId}]
```

### likeFeedItems(oauth,feedItemId,callback)
Like a feed Item represented by `feedItemId`.

### shareFeedItem(oauth,feedItemId,userId,callback) 
Share a feed Item represented by `feedItemId`.

### getNewsFeed(oauth, callback) 
Get News feed for the current user.

### searchARecordFeed(oauth,searchString,callback)
Search a record feed.  The record can be a group, person, object, file, and so on. For example, use this resource to search a group feed. The `searchString` can contain wildcards and must contain at least two characters that aren’t wildcards. 

### getFeedItemsForARecord(oauth,recordId,callback)
Get feed Items for a record represented by `recordId`.

### getListOfWhatUserIsFollowing(oauth,userId,callback)
Gets the list of whatever user is following.

### getActivityStatisticsForUser(oauth,userId,callback) 
Gets the activity status for the user represented by `userId`.

### getRecommendations(oauth,callback)
Get recommendations for current user.

### joinGroup(oauth,userId,groupId,callback)
Join a group represented by `groupId`.

### requestToJoinGroup(oauth,userId,groupId,callback) 
Requests the user represented by `userId` to join the group whose Id is groupId

### respondToJoinGroup(oauth,requestId,reply,callback)
Sends a reply to the request with id equal to `requestId`. Reply can be Accept or Reject

### followARecord(oauth,subjectId,callback)
Follow a rcord with Id equal to `subjectId`. If the record is a user then `subjectId` will be id of that user.

### unFollowARecord(oauth,subscriptionId,callback)
Unfollow a rcord with Id equal to `subscriptionId`.

### followARecord(oauth,subjectId,callback)
Follow a rcord with Id equal to `subjectId`.

### sendPrivateMessage(oauth,body,recipients,callback)
Send private message to a mulitiple receipients.
`recipients` is an array which contains userId of recipients.
```
var recipients = ['00590000000HQ1LAAW','00590000000z1KOAAY'];
```
`body` is the message which you want to send.

### getCurrentChatterUser(oauth, callback)
Gets the current Chatter User Object.

### getAllChatterFeedItems(oauth, callback)
Gets all the Chatter feed Items.

## Todo

* **nforce** cli implementation
* Continue with caching capabilities for describe/metadata calls
* Chatter support
* Tooling API

## Contributors

* Kevin O'Hara -> [kevinohara80](https://github.com/kevinohara80)
* Jeff Douglas -> [jeffdonthemic](https://github.com/jeffdonthemic)
* Zach McElrath -> [zachelrath](https://github.com/zachelrath)
* Chris Bland -> [chrisbland](https://github.com/chrisbland)
* Jeremy Neander -> [jneander](https://github.com/jneander)

## Changelog

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