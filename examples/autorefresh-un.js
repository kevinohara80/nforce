var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  autoRefresh: true,
  mode: 'single',
  onRefresh: function(newOAuth, oldOauth, cb) {
    console.log('onRefresh called');
    cb();
  }
});

org.authenticate({ username: sfuser, password: sfpass }, function(err, oauth) {
  if(err) throw err;
  console.log('authenticated!');
  console.log('access token: ' + oauth.access_token.substr(0,10));
  org.revokeToken({ oauth: oauth, token: oauth.access_token }, function(err, res) {
    if(err) throw err;
    console.log('access token invalidated');
    org.query({ query: 'SELECT Id FROM Account LIMIT 1', oauth: oauth }, function(err, res) {
      if(err) {
        console.log('bummer, the autorefresh didn\'t work');
        console.log(err);
      } else {
        console.log('query ran...looks good');
      }
    });
  });
});
