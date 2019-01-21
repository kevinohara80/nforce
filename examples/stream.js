var nforce = require('../');

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  autoRefresh: true,
  environment: 'production',
  apiVersion: 'v44.0',
  mode: 'single'
});

var SFUSER = process.env.SFUSER;
var SFPASS = process.env.SFPASS;


org.authenticate({ username: SFUSER, password: SFPASS}, function(err, oauth) {

  if(err) return console.log(err);

  const client = org.createStreamClient();

  const sub = client.subscribe({ topic: '/event/Test_Event__e' });

  client.on('connect', function () {
    console.log('streaming client transport: up');
  });

  client.on('disconnect', function (data) {
    console.log('streaming disconnect: ' + data.reason);
    console.log('disconnect data', data);
  });

  sub.on('connect', function () {
    console.log('connected to topic: ' + sub.getTopic());
  });

  sub.on('error', function (error) {
    console.log('error: ' + error);
    sub.cancel();
    client.disconnect();
  });

  sub.on('data', function (data) {
    console.log(data);
    console.log('current replay id: ' + sub.getReplayId())
  });

});
