var nforce = require('../../');

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  environment: 'production',
  apiVersion: 'v25.0'
});

org.stream('TestStream', req.session.oauth, function(resp) {
  console.log(resp);
});