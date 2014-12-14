var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var oauth;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  mode: 'single'
});

var ld;

console.log('authenticating');

org.authenticate({ username: sfuser, password: sfpass }).then(function(oauth){

  return org.getSObjects();

}).then(function(resp){

  resp.sobjects.forEach(function(so) {
    console.log(so.name);
  });

}).catch(function(err) {

  console.error('failed');
  console.error(err);

});
