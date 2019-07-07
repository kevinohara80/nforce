var nforce = require('../');

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  environment: 'production',
  apiVersion: 'v30.0',
  mode: 'single',
  username: process.env.SFUSER,
  password: process.env.SFPASS
});


org.authenticate().then(function() {

  var client = org.createStreamClient();

  var logs = client.subscribe({ topic: 'Logging', isSystem: true });

  console.log('subscribing to ' + logs._topic);

  logs.on('error', function(err) {
    console.log('subscription error');
    console.log(err);
    client.disconnect();
  });

  logs.on('data', function(data) {
    console.log(data);
    client.disconnect();
  });

});
