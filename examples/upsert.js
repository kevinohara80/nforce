var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var clientId = process.env.CLIENTID;
var clientSecret = process.env.CLIENTSECRET;

var oauth;

var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: 'http://localhost:3000/oauth/_callback',
  mode: 'single'
});

function createContact() {
  var account = nforce.createSObject('Account', { Name: 'Kevin Enterprises' });

  account.setExternalId('Account_No__c', '232');

  org.upsert(account, function(err, resp) {
    if(err) return console.error(err);
    console.log(resp);
  });

}

org.authenticate({ username: sfuser, password: sfpass}, function(err, resp) {
  if(err) {
    console.error('--> unable to authenticate to sfdc');
    console.error('--> ' + JSON.stringify(err));
  } else {
    console.log('--> authenticated!');
    createContact();
  }
});
