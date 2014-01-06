var nforce = require('../../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

// load the plugin
require('./plugin')(nforce);

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  mode: 'single'
});

console.log(org.foo()); // => 'bar'

org.getApiVersion(function(err, msg) {
  if(err) throw err;
  console.log(msg); // => current api version
});

console.log(org.doValidateOAuth({ invalid: 'oauth' })); // => 'false'