nforce
======

**nforce** is node.js a REST API wrapper for force.com, database.com, and salesforce.com.

## Features

* Simple api
* Connection object to manage multiple force.com connections in a single app
* Helper oauth methods

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
  apiVersion: 'v24.0'  // optional, defaults to 24.0
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

To perform an authorization code flow, first redirect users to the Authorization URI. **nforce** provides a helper function to build this url for you.

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

### Express Middleware

**nforce** has built-in support for express using the express/connect middleware system. The middleware handles the oauth callbacks. To use the middleware you must have sessions enabled in your express configuration.

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

## API

Callbacks will always pass an optional error object, and a response object.

```js
callback(err, resp);
```

The following list of methods are available for an **nforce** connection object

### getAuthUri()

This is a helper method to build the authentication uri for a authorization code OAuth 2.0 flow.

### authenticate(opts, callback)

This method requests the OAuth access token and instance information from Salesforce. This method either requires that you pass in the authorization code (authorization code flow) or username and password (username/password flow).

* `code`: An OAuth authorization code

-- OR --

* `username`: Your salesforce/force.com/database.com username
* `password`: Your salesforce/force.com/database.com password

### getVersions(callback)

Gets the salesforce versions. Note: Does not require authentication

### 
## Todo

* Integrated support for Express w/ automated oauth callback generation