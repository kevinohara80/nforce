var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var search = 'FIND {kevin}';

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

org.authenticate({ username: sfuser, password: sfpass}, function(err, oauth) {
  if(err) {
    console.error('unable to authenticate to sfdc');
  } else {
    org.search({ search: search, oauth: oauth }, function(err, resp) {
      if(err) throw err;
      console.log(resp);
      // if(resp.records && resp.records.length) {
      //   resp.records.forEach(function(rec) {
      //     console.log('Lead: ' + rec.get('FirstName') + ' ' + rec.get('LastName'));
      //   });
      // }
    });
  }
});
