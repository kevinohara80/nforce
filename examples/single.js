var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  mode: 'single'
});

org.authenticate({ username: sfuser, password: sfpass}, function(err, res) {
  if(err) return console.error('unable to authenticate to sfdc');

  // look ma, no oauth argument!
  org.query('SELECT Id FROM Lead LIMIT 1', function(err, res) {
    if(err) return console.error(err);
    else return console.log(res.records[0]);
  });
  
});