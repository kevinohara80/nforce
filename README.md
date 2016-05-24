nforce :: node.js salesforce REST API wrapper
======

[![Build Status](https://secure.travis-ci.org/kevinohara80/nforce.png)](http://travis-ci.org/kevinohara80/nforce)

**nforce** is node.js a REST API wrapper for force.com, database.com,
and salesforce.com.

## Features

* Simple api
* Intelligent sObjects
* Helper OAuth methods
* Simple streaming
* Multi-user design with single user mode
* Plugin support

## Installation

```bash
$ npm install nforce
```

## Usage

Require **nforce** in your app and create a client connection to a
Salesforce Remote Access Application.

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

Now we just need to authenticate and get our salesforce OAuth
credentials. Here is one way to do this in multi-user mode...

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

Now we can go nuts. **nforce** has an salesforce sObject factory
method that creates records for you. Let's use that and insert a
record...

```js
var acc = nforce.createSObject('Account');
acc.set('Name', 'Spiffy Cleaners');
acc.set('Phone', '800-555-2345');
acc.set('SLA__c', 'Gold');

org.insert({ sobject: acc, oauth: oauth }, function(err, resp){
  if(!err) console.log('It worked!');
});
```

If you are in single-user mode, the `oauth` argument can be ommitted
since it's cached as part of your connection object.

```js
org.insert({ sobject: acc }, function(err, resp){
  if(!err) console.log('It worked!');
});
```

Querying and updating records is super easy. **nforce** wraps
API-queried records in a special object. The object caches field
updates that you make to the record and allows you to pass the
record directly into the update
method without having to scrub out the unchanged fields. In the
example below, only the Name and Industry fields will be sent in the
update call despite the fact that the query returned other fields
such as BillingCity and CreatedDate.

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

Most of the files in the examples directory can be used by simply
setting two environment variables then running the files. The two
environment variables are `SFUSER` and `SFPASS` which are your
Salesforce.com username and passsword, respectively. Example below:

```bash
$ export SFUSER=myusername@salesforce.com
$ export SFPASS=mypassword
$ node examples/crud.js
```

## Authentication

**nforce** supports three Salesforce OAuth 2.0 flows,
username/password, Web Server and User-Agent.

### Username/Password flow

To request an access token and other oauth information using the
username and password flow, use the `authenticate()` method and pass
in your username, password and security token in the options.

**Note:** A security token can be generated from the Salesforce
dashboard under: Account Name > Setup > My Personal Information >
Reset My Security Token.

```js
var username      = 'my_test@gmail.com',
    password      = 'mypassword',
    securityToken = 'some_security_token',
    oauth;

org.authenticate({ username: username, password: password, securityToken: securityToken }, function(err, resp){
  if(!err) {
    console.log('Access Token: ' + resp.access_token);
    oauth = resp;
  } else {
    console.log('Error: ' + err.message);
  }
});
```

The Salesforce website suggests appending the security token to the
password in order to authenticate. This works, but using the
`securityToken` parameter as shown above is cleaner. Here's why the
security token is necessary, from the [Salesforce Website][sf]:

> The security token is an automatically generated key that must be
added to the end of the password in order to log in to Salesforce
from an untrusted network. You must concatenate their password and
token when passing the request for authentication.

[sf]: http://help.salesforce.com/apex/HTViewHelpDoc?id=remoteaccess_oauth_username_password_flow.htm&language=en_US

### Web Server Code Flow

To perform an authorization code flow, first redirect users to the
Authorization URI at Salesforce. **nforce** provides a helper
function to build this url for you.

```js
org.getAuthUri();
```

An example of using this function in a typical node route would be:

```js
app.get('/auth/sfdc', function(req,res){
  res.redirect(org.getAuthUri());
});
```

Once you get a callback at the Redirect URI that you specify, you
need to request your access token and other important oauth
information by calling
`authenticate()` and passing in the "code" that you received.

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

An example of using this function in a typical node route and populating the code from the request would be:

```js
app.get('/auth/sfdc/callback', function(req, res) {
  org.authenticate({code: req.query.code}, function(err, resp){
    if(!err) {
      console.log('Access Token: ' + resp.access_token);
    } else {
      console.log('Error: ' + err.message);
    }
  });
});
```

### User-Agent Flow

The user-agent flow simply redirects to your `redirectUri` after the
user authenticates and logs in. The `getAuthUri()` method can be
used similar to the Web Server flow but a responseType property must
be set to `token`.

```js
org.getAuthUri({ responseType: 'token' });
```

### OAuth Object

At the end of a successful authorization, you a returned an OAuth
object fo the user. This object contains your salesforce access
token, endpoint, id, and other information.  If you have `mode` set
to `multi`, cache this object for the user as it will be used for
subsequent requests. If you are in `single` user mode, the OAuth
object is stored as a property on your salesforce connection object.

### OAuth Object De-Coupling (Multi-user mode)

**nforce** decouples the oauth credentials from the connection
object when `mode` is set to `multi` so that in a multi-user
situation, a separate connection object doesn't need to be created
for each user. This makes the
module more efficient. Essentially, you only need one connection
object for multiple users and pass the OAuth object in with the
request. In this scenario, it makes the most sense to store the
OAuth credentials in the users session or in some other data store.
If you are using [express](https://github.com/visionmedia/express),
**nforce** can take care of storing this for you (see Express
Middleware).

### Integrated OAuth Object (Single-user mode)

If you specified `single` as your `mode` when creating the
connection, calling authenticate will store the OAuth object within
the connection object. Then, in subsequent API requests, you can
simply omit the OAuth object from the request like so.

```js
// look ma, no oauth argument!
org.query({ query: 'SELECT Id FROM Lead LIMIT 1' }, function(err, res) {
  if(err) return console.error(err);
  else return console.log(res.records[0]);
});
```

### Access Token Auto-Refreshes

**nforce** provides an optional, built-in function for
auto-refreshing access tokens when able it's able to. This requires
you are using the web-server flow and you've requested the right
scope that returns you a refresh_token. The username/password flow
is also supported if using single-user mode.

To enable auto-refreshes, you just need to set the `autoRefresh`
argument when creating your connection...

```js
var nforce = require('nforce');

var org = nforce.createConnection({
  clientId: 'SOME_OAUTH_CLIENT_ID',
  clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  apiVersion: 'v29.0',
  environment: 'production',
  mode: 'multi',
  autoRefresh: true // <--- set this to true
});
```

Now when you make requests and your access token is expired,
**nforce** will automatically refresh your access token from
Salesforce and re-try your original request...

```js
console.log('old token: ' + oauth.access_token);
org.query({ query: 'SELECT Id FROM Account LIMIT 1', oauth: oauth }, function(err, records){
  if(err) throw err;
  else {
    console.log('query completed with token: ' + oauth.access_token); // <--- if refreshed, this should be different
    res.send(body);
  }
});
```

**NOTE:** If you're using express and storing your oauth in the
session, if you pass in your session oauth directly, it's going to
be updated automatically by nforce since the autoRefresh function
mutates the oauth object that's
passed in.

There's also a handy callback function called `onRefresh` that can
be added to your connection that will execute when any request
triggers an auto-refresh of your access token. This makes keeping
stored credentials up-to-date a breeze. Here's a pseudo-example of
how that would work.

```js
var nforce = require('nforce');

var org = nforce.createConnection({
  clientId: 'SOME_OAUTH_CLIENT_ID',
  clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  apiVersion: 'v29.0',
  environment: 'production',
  mode: 'multi',
  autoRefresh: true, // <--- set this to true
  onRefresh: function(newOauth, oldOauth, cb) {
    // find outdated access tokens in the db and update them
    mydb.findOauthByAccessToken(oldOauth.access_token, function(err, oauth) {
      oauth.access_token = newOauth.access_token;
      oauth.save();
      // make sure you call the callback from the onRefresh function
      cb();
    });
  }
});
```

## Other Features

### Force.com Streaming API Support

**nforce** supports the Force.com Streaming API. Connecting to one of
your PushTopics is easy using nforce. Here's how you create a
streaming client and subscribe to a PushTopic.

```js
org.authenticate({ username: user, password: pass }, function(err, oauth) {

  if(err) return console.log(err);

  var client = org.createStreamClient();

  console.log('subscribing to ' + logs._topic);
  var accs = client.subscribe({ topic: 'NewAccounts' });

  accs.on('error', function(err) {
    console.log('subscription error');
    console.log(err);
    client.disconnect();
  });

  accs.on('data', function(data) {
    console.log(data);
  });

});
```

There is also a short-hand method for creating a client and a
subscription right from your nforce connection object. You can
access the underlying client from the subscription object.

```js
var accs = org.subscribe({ topic: 'NewAccounts' });

// close the client after 5 seconds
setTimeout(function(){
  accs.client.disconnect();
}, 5000);
```

When you are done with your subscription you can close it. You can
also disconnect the client connection.

```js
accs.cancel();
client.disconnect();
```

### Plugins

As of **nforce** v0.7.0, a plugin API is now exposed so that the
capabilities of nforce can easily be extended. This plugin system
also allows the core of nforce to remain small, handling mostly
authentication, CRUD, query, search,and other basic API requests.
As Salesforce releases additional API's or as authors find
interesting ways to extend nforce, these can easily be built into
plugins and added to your nforce configuration as-needed.

To use plugins in your application, you'll need to load them
into nforce and specify which plugins to use when creating a
connection object. Here is an example.

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

You'll notice that the plugins methods are all namespaced. This is
to prevent method naming conflicts between plugins. As a
best-practice, plugin authors should make their namespace the same
as the module name but it's best to refer
to their documentation for the exact namespace when using their
plugin.

Here is a list of some available plugins today:

* [nforce-tooling](https://github.com/jeffdonthemic/nforce-tooling) Tooling API support
* [nforce-chatter](https://github.com/jeffdonthemic/nforce-chatter) Chatter API support
* [nforce-metadata](https://github.com/kevinohara80/nforce-metadata) Metadata API support
* [nforce-express](https://github.com/kevinohara80/nforce-express) Express.js plugin for
OAuth authentication helpers

Documentation on authoring plugins is coming soon...

## nforce API Basics

### Callbacks

The API of **nforce** follows typical node.js standards. Callbacks
will always pass an optional error object, and a response object. The
response object closely resembles the typical responses from the
Salesforce REST API.

```js
var myCallback = function(err, resp);

org.getUrl(url, myCallback);
```

### Promises

**nforce** also supports promises based on
[Bluebird](https://github.com/petkaantonov/bluebird). When no
callback is supplied to an asynchronous method (like an api call),
a promise will be returned. This makes control-flow very simple.

```js
org.authenticate({ username: un, password: pw }).then(function(){
  return org.getResources();
}).then(function(resources) {
  console.log('resources: ' + resources);
}).error(function(err) {
  console.error('there was a problem');
});
```

## nforce Base Methods

### createConnection(opts)

The createConnection method creates an *nforce* salesforce connection
object.
You need to supply some arguments including oauth information and
some optional arguments for version and salesforce environment type.

* `clientId`: (String:Required) This is the OAuth client id
* `clientSecret`: (String:Required) This is the OAuth client secret
* `redirectUri`: (String:Required) This is the redirect URI for OAuth
callbacks
* `apiVersion`: (String|Number:Required) This is a number or string
representing a valid REST API version. Default is the latest current
api version.
* `environment`: (String:Optional) Values can be 'production' or
'sandbox'.
Default is production.
* `authEndpoint`: (String:Optional) Used to override the
authentication endpoint for production environments.
* `testAuthEndpoint`: (String:Optional) Used to override the
authentication endpoint for production environments.
* `loginUri`: (String:Optional) Used to override the login URI if
needed.
* `testLoginUri`: (String:Optional) Used to override the testLoginUri
if needed.
* `gzip`: (Boolean:Optional) If set to boolean 'true', then *nforce*
will request that salesforce compress responses (using gzip) before
transmitting over-the-wire.
* `autoRefresh`: (Boolean:Optional) If set to boolean 'true',
*nforce* will auto-refresh your oauth access token if it tries a
request and fails due to an expired token. Only works with web oauth
and username/password flows.
* `onRefresh`: (Function:Optional) This is a function that is called
when a request going through the connection triggers an auto-refresh.
This hook is handy for updating your oauth tokens in a database or
other store. The function is passed three arguments `newOauth`,
`oldOauth`, and a `callback`
function. The callback must be called with either an error or null
value.
* `timeout`: (Number:Optional) Integer containing the number of
milliseconds
to wait for a request to respond before aborting the request.
* `username`: (String:Optional) The username to be used
for the connection (single-user mode only)
* `password`: (String:Optional) The password to be used
for the connection (single-user mode only)
* `securityToken`: (String:Optional) The security token to be used
for the connection (single-user mode only)
* `oauth`: (Object:Optional) The oauth object to be used for the
connection (single-user mode only)

### createSObject(type, [fieldValues])

This creates an sObject record that you can use to insert, update,
upsert, and delete. `type` should be the salesforce API name of the
sObject that you are updating. `fieldValues` should be a hash of
field names and values that you want to initialize your sObject with.
You can also just assign fields and values by setting properties
after you create the sObject.

## plugin(namespace|opts)

This creates an nforce plugin. Plugins allow you to extend the
functionality of nforce. You need to initialize the plugin with a
`namespace` or an options hash containing a namespace. Valid options
include:

* `namespace`: (String:Required) This sets the namespace for your
plugin
* `override`: (Boolean:Optional) Override *true* allows you to
overwrite an existing plugin. Default is false.

## Salesforce sObject Methods

### get(field)

Get the value of a field on the sObject

### set(field, value) OR set(hash)

Set the value of a single field (field, value) or set multiple
fields using a hash.

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

For upsert methods, you need to specify the External Id field and the
value that you are trying to match on.

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

Checks to see if the field has been changed since the last save on
the server

### changed()

Returns a hash of the changed fields and their current values

### previous()

Returns a hash of the previous values for changed fields

### toJSON()

Returns a JSON representation of the fields in the sObject

## Connection Methods

The following list of methods are available for an **nforce**
connection object.

Please note that you may pass custom `headers` to any of the requests
that support an `opts` hash. Here is an example:

```js
var headers = {
  'sforce-auto-assign': '1'
};

org.insert({ oauth: oauth, sobject: so, headers: headers }, function(err, record) {
  // callback
});
```

### getAuthUri([opts])

This is a helper method to build the authentication uri for a
authorization code OAuth 2.0 flow. You can optionally pass in an
OAuth options argument. The supported options are:
* `responseType`: (String:Optional) Any valid response_type that is
supported by Salesforce OAuth 2.0. Default is `code`.
* `authEndpoint`: (String:Optional) Override the auth endpoint to
use for the token request
* `display`: (String:Optional) Tailors the login page to the user's
device type. Currently the only values supported are `page`,
`popup`, and `touch`
* `immediate`: (Boolean:Optional) Avoid interacting with the user.
Default is false.
* `scope`: (Array:Optional) The scope parameter allows you to
fine-tune what the client application can access. Supported values
are `api`, `chatter_api`,
`full`, `id`, `refresh_token`, `visualforce`, and `web`
* `state`: (String:Optional) Any value that you wish to be sent
with the callback
* `nonce`: (String:Optional) Optional with the openid scope for
getting a user ID token
* `prompt`: (String|Array:Optional) Specifies how the authorization
server
prompts the user for re-authentication and reapproval. Values are
`login`,
`consent` or both in the form of an array.
* `loginHint`: (String:Optional) Provide a valid username value with
this parameter to pre-populate the login page with the username.
* `urlOpts`: (Object:Optional) Specify any other url arguments to
include in the request.

### authenticate(opts, [callback])

This method requests the OAuth access token and instance information
from Salesforce or Force.com. This method either requires that you
pass in the authorization code (authorization code flow), username and
password (username/password flow), or a SAML assertion (SAML Bearer
Assertion Flow).

* `code`: (String:Optional) An OAuth authorization code
* `username`: (String:Optional) Your
salesforce/force.com/database.com username
* `password`: (String:Optional) Your
salesforce/force.com/database.com password
* `securityToken`: (String:Optional) Your Salesforce security token.
This will be appended to your password if this property is set.
* `assertion`: (String:Optional) A base64-encoded SAML assertion used
in a SAML Bearer Assertion flow.
* `executeOnRefresh`: (Boolean:Optional) If an onRefresh callback is
defined
in the connection, run the callback. Default is false.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

### refreshToken(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `assertion`: (String:Optional) A base64-encoded SAML assertion for use
with the SAML Bearer Assertion Flow. The assertion can also be supplied as
property of the `oauth` hash.
* `executeOnRefresh`: (Boolean:Optional) If an onRefresh callback is
defined
in the connection, run the callback. Default is true.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

### revokeToken(opts|token, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in multi-user
mode
* `token`: (String:Required) The oauth access_token or refresh_token
you want to revoke
* `callbackParam`: (String:Optional) A callback parameter to be
supplied to the request for JSONP support
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

### getPasswordStatus(opts|id, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in multi-user
mode
* `id`: (String:Optional) The id of the User. Required only if
`sobject` is not defined
* `sobject`: (String:Optional) The user sobject. Required only if
`id` is not defined.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

### updatePassword(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `newPassword`: (String:Required) The new password to be set for
the user.
* `id`: (String:Optional) The id of the User. Required only if
`sobject` is
not defined.
* `sobject`: (String:Optional) The user sobject. Required only if
`id` is not
defined.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

## getIdentity(opts, [callback])

opts:
* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

### getVersions([callback])

opts:

* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Gets the salesforce versions. Note: Does not require authentication.

### getResources(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Gets the available salesforce resources

### getSObjects(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get all sObjects for an org

### getMetadata(opts|type, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `type`: (String:Required) The metadata type that is being requested
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get metadata for a single sObject. `type` is a required String
for the sObject type

### getDescribe(opts|type, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `type`: (String:Required) The metadata type that is being requested
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get describe information for a single sObject. `type` is a required
String for the sObject type

### getLimits(opts|type, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode

Lists information about limits in your organization

### insert(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Required) An sObject instance
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Insert a record.

### update(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Required) An sObject instance
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Update a record.

### upsert(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Required) An sObject instance
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Update a record. NOTE: you must use the setExternalId() method to set
the external Id field and the value to match on.

### delete(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Required) An sObject instance
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Delete a record.

### getRecord(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Optional) An sObject instance.
* `fields`: (Array:Optional) An array of fields to return
* `type:`: (String:Optional) A string value sObject type
* `id`: (String:Optional) A string value for the sObject record id
* `raw`: (Boolean:Optional) Tells nforce to return the raw
response from Salesforce and skip the SObject wrapping. Default
is false.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get a single record. You must supply either an `sobject` or `type`
and `id`

### getBody(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Optional) An sObject instance.
* `type:`: (String:Optional) A string value sObject type
* `id`: (String:Optional) A string value for the sObject record id
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get the binary data for an attachment, document, or contentversion.
You must supply either an `sobject` or `type` and `id`. The `sobject`
must be one of those three types.

### getAttachmentBody(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Optional) An sObject instance.
* `id`: (String:Optional) A string value for the sObject record id
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get the binary data for an attachment. You must supply either an
`sobject` or an `id`.

### getDocumentBody(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Optional) An sObject instance.
* `id`: (String:Optional) A string value for the sObject record id
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get the binary data for a document. You must supply either an
`sobject` or an `id`.

### getContentVersionBody(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `sobject`: (Object:Optional) An sObject instance.
* `id`: (String:Optional) A string value for the sObject record id
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get the binary data for a contentversion. You must supply either
an `sobject` or an `id`.

### query(opts|query, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `query`: (String:Required) An query string
* `includeDeleted`: (Boolean:Optional) Query also deleted records.
Default is false.
* `raw`: (Boolean:Optional) Tells nforce to return the raw
response from Salesforce and skip the SObject wrapping.
Default is false.
* `fetchAll`: (Boolean:Optional) Specifying fetchAll to true tells
nforce to recursively query to get all possible returned records.
Default is false.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Execute a SOQL query for records.

### queryAll(opts|query, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `query`: (String:Required) An query string
* `raw`: (Boolean:Optional) Tells nforce to return the raw response
from Salesforce and skip the SObject wrapping. Default is false.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Same as query but includes deleted records.

### search(opts|search, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `search`: (String:Required) An search string
* `raw`: (Boolean:Optional) Tells nforce to return the raw response
from Salesforce and skip the SObject wrapping. Default is false.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Execute a SOSL search for records. `search` should be a SOSL string.

### getUrl(opts|url, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `url`: (String:Required) An url string for an api resource
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Get a REST API resource by its url.

### createStreamClient(opts)

opts:
* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `timeout`: (Integer:Optional) The timeout in seconds to pass to
the Faye client
* `retry`: (Integer:Optional) The retry interval to pass to the
Faye client

Creates and returns a streaming api client object. See the *Streaming
Client* section for more details on the client object that is
returned from this method.

### subscribe|stream(opts)

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `topic`: (String:Required) An string value for the streaming topic
* `isSystem`: (Boolean:Optional) Specify `true` if the topic to be
streamed is a SystemTopic
* `timeout`: (Integer:Optional) The timeout in seconds to pass to
the Faye client
* `retry`: (Integer:Optional) The retry interval to pass to the
Faye client

Creates and returns a streaming api subscription object. See the
*Streaming Subscription* section for more details on the
subscription object that is returned from this method.

### apexRest(opts|uri, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `uri`: (String:Required) A string value for endpoint. Should
not include '/services/apexrest'
* `method`: (String:Optional) String method that defaults to GET if
not supplied
* `urlParams`: (Object|String:Optional) A hash or url params to
add to the request
* `body`: (Object:Optional) The optional JSON body for the request.
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

This method handles integration with salesforce ApexRest
(Custom Rest endpoints)
http://wiki.developerforce.com/page/Creating_REST_APIs_using_Apex_REST

## autoRefreshToken(opts, [callback])

opts:

* `oauth`: (Object:Optional) The oauth object. Required in
multi-user mode
* `requestOpts`: (Object:Optional) Optional hash of parameters to
pass to the underlying request.

Auto-refresh the current access token. Works with refresh tokens
and also if using username/password in single user mode

## Streaming Client

The streaming Client object represents a streaming client created
from the connections `createStreamClient()` method. The Streaming
Client emits several events:

events:

* `connect`: Emits when the clients transport is up
* `disconnect`: Emits when the clients transport is down

### subscribe(opts)

opts:

* `topic`: (String:Required) An string value for the streaming topic
* `isSystem`: (Boolean:Optional) Specify `true` if the topic to be
streamed is a SystemTopic

Creates and returns a streaming api subscription object. See the
*Streaming Subscription Methods* section for more details on the
subscription object.

### disconnect()

Disconnects the streaming client and will close all subscriptions

## Streaming Subscription

The Subscription object represents a subscription created from the
streaming Client by calling `client.subscribe()`. This object emits
several events.

events:

* `connect`: Emits when the subscription becomes active.
* `error`: Emits an error object when the subscription encounters
an error
* `data`: Emits a data object when the subscription receives an event

### cancel()

Cancels the subscription. This does not close the client.
