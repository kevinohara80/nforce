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

org.authenticate({ username: sfuser, password: sfpass }).then(function() {
  console.log('authenticated!');
  console.log('revoking token');
  return org.revokeToken({ token: org.getOAuth().access_token });
}).then(function(){
  console.log('token revoked!');
  console.log('testing query');
  return org.query({ query: 'SELECT Id FROM Account LIMIT 1' });
}).then(function(results){
  console.log('query successful!');
  console.log('records returned: ' + results.records.length);
}).error(function(err){
  console.error('failed!');
  console.error(err);
});
