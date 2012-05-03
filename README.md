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
  redirectUri: 'http://localhost:3000/oauth/_callback'
});
```

## Authentication

**nforce** supports two OAuth 2.0 flows, username/password and authorization code.

### Username/Password flow

To request an access token using the username and password flow, use the `authenticate()` method and pass in your username and password in the options

```js
org.authenticate({ username: 'my_test@gmail.com', password: 'mypassword'}, function(err, resp){
  if(!err) {
    console.log('Access Token: ' + resp.access_token);
  } else {
    console.log('Error: ' + err.message);
  }
});
```

### Authorization Code Flow

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