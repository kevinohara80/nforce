var nforce = require('../');
var fakeweb = require('node-fakeweb');

function createConnection(options){
  var org = nforce.createConnection({
    clientId: 'SOME_OAUTH_CLIENT_ID',
    clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
    redirectUri: 'http://localhost:3000/oauth/_callback',
    apiVersion: 'v24.0',
    environment: options.environment || 'production',
    mode: options.mode,
    loginUri: options.loginUri,
    testLoginUri: options.testLoginUri
  });
  org.oauth = options.oauth;
  return org;
};

function setFakewebResponse(options){
  fakeweb.allowNetConnect = false;
  fakeweb.registerUri({
    uri: options.uri || 'https://login.salesforce.com:443/services/oauth2/token',
    statusCode: options.statusCode,
    body: options.body,
    headers: options.headers
  });
};

module.exports.createConnection = createConnection;
module.exports.setFakewebResponse = setFakewebResponse;
