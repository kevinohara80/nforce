var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

org.authenticate({ username: sfuser, password: sfpass }, function(err, oauth) {
  if(err) throw err;
  console.log('authenticated! access_token=' + oauth.access_token);
  org.revokeToken({ oauth: oauth, token: oauth.access_token }, function(err, res) {
    if(err) throw err;
    console.log('access token invalidated');
    org.query({ query: 'SELECT Id FROM Account LIMIT 1', oauth: oauth }, function(err, res) {
      if(err && err.errorCode === 'INVALID_SESSION_ID') {
        console.log('success, the token is no longer valid');
      } else {
        console.log('something went wrong, the token is still valid');
      }
    });
  });
});
