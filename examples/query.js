var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var clientId = process.env.CLIENTID;
var clientSecret = process.env.CLIENTSECRET;

var query = 'SELECT Id, FirstName, LastName, Email FROM Lead LIMIT 10';

var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

org.authenticate({ username: sfuser, password: sfpass}, function(err, oauth) {
  if(err) {
    console.error('unable to authenticate to sfdc');
  } else {
    org.query(query, oauth, function(err, resp) {
      if(resp.records && resp.records.length) {
        resp.records.forEach(function(rec) {
          console.log('Lead: ' + rec.FirstName + ' ' + rec.LastName);
        }); 
      }
    });
  }
});

