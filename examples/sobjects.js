var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var clientId = process.env.CLIENTID;
var clientSecret = process.env.CLIENTSECRET;

var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

org.authenticate({ username: sfuser, password: sfpass}, function(err, oauth) {
  if(err) {
    console.error('unable to authenticate to sfdc');
  } else {
    org.getSObjects(oauth, function(err, resp) {
      if(err) {
        console.error(err);
      } else {
        resp.sobjects.forEach(function(so) {
          console.log(so.name);
        });
      }
    });
  }
});
