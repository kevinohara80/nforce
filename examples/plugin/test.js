var nforce = require('../../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var clientId = process.env.CLIENTID;
var clientSecret = process.env.CLIENTSECRET;

// load the plugin
require('./myplugin')(nforce);

var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: 'http://localhost:3000/oauth/_callback',
  mode: 'single',
  plugins: ['myplugin'] // make sure you enable it when creating a connection
});

console.log(org.myplugin.foo()); // => 'bar'

org.myplugin.getApiVersion(function(err, msg) {
  if(err) throw err;
  console.log(msg); // => current api version
});

console.log(org.myplugin.doValidateOAuth({ invalid: 'oauth' })); // => 'false'
