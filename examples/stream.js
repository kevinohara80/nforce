var nforce = require('../');

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  environment: 'production',
  apiVersion: 'v30.0'
});


org.authenticate({ username: process.env.SFUSER, password: process.env.SFPASS}, function(err, oauth){

  if(err) return console.log(err);

  console.log('connecting to topic');
  var str = org.stream({ topic: 'AllAccounts', oauth: oauth });

  str.on('connect', function(){
    console.log('connected to pushtopic');
  });

  str.on('error', function(error) {
    console.log('error: ' + error);
  });

  str.on('data', function(data) {
    console.log(data.event.type + ': ' + data.sobject.Name);
    str.cancel();
    str.client.disconnect();
  });

});
