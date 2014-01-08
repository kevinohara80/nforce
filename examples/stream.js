var nforce = require('../');
var clientId = process.env.CLIENTID;
var clientSecret = process.env.CLIENTSECRET;

var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: 'http://localhost:3000/oauth/_callback',
  environment: 'production',
  apiVersion: 'v25.0'
});


org.authenticate({ username: process.env.SFUSER, password: process.env.SFPASS}, function(err, oauth){
  
  if(err) return console.log(err);

  var str = org.stream('AllAccounts', oauth);

  str.on('connect', function(){
    console.log('connected to pushtopic');
  });

  str.on('error', function(error) {
    console.log('error: ' + error);
  });

  str.on('data', function(data) {
    console.log(data);
  });

});

