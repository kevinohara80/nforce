var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

function query(oauth) {
  console.log('testing a query');
  org.query({ query: 'SELECT Id FROM Account LIMIT 1', oauth: oauth }, function(err, res) {
    if(err) throw err;
    console.log('the query completed successfully');
  });
}

function revoke(oauth) {
  console.log('revoking token');
  org.revokeToken({ oauth: oauth, token: oauth.access_token }, function(err, res) {
    if(err) throw err;
    console.log('access token invalidated');
    query(oauth);
  });
}

function authenticate() {
  console.log('authenticating')
  org.authenticate({ username: sfuser, password: sfpass }, function(err, oauth) {
    if(err) throw err;
    console.log('authenticated!');
    revoke(oauth);
  });
}

function run() {
  console.log('running test');
  authenticate();
}

run();

