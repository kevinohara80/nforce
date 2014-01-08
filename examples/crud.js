var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var clientId = process.env.CLIENTID;
var clientSecret = process.env.CLIENTSECRET;

var oauth;

var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

function deleteLead(ld) {
  console.log('attempting to delete lead');
  org.delete(ld, oauth, function(err, resp) {
    if(err) {
      console.error('--> unable to delete lead');
      console.error('--> ' + JSON.stringify(err));
    } else {
      console.log('--> lead deleted');
    }
  });
}

function updateLead(ld) {
  console.log('attempting to update lead');
  ld.Company = 'JJ Inc.';
  org.update(ld, oauth, function(err, resp) {
    if(err) {
      console.error('--> unable to update lead');
      console.error('--> ' + JSON.stringify(err));
    } else {
      console.log('--> lead updated');
      deleteLead(ld);
    }
  });
}

function insertLead() {
  console.log('Attempting to insert lead');
  var ld = nforce.createSObject('Lead', {
    FirstName: 'Bobby',
    LastName: 'Tester',
    Company: 'ABC Widgets',
    Email: 'bobbytester@testertest.com'
  });
  org.insert(ld, oauth, function(err, resp) {
    if(err) {
      console.error('--> unable to insert lead');
      console.error('--> ' + JSON.stringify(err));
    } else {
      console.log('--> lead inserted');
      updateLead(ld);
    }
  });
}

console.log('Authenticating with Salesforce');

org.authenticate({ username: sfuser, password: sfpass}, function(err, resp) {
  if(err) {
    console.error('--> unable to authenticate to sfdc');
    console.error('--> ' + JSON.stringify(err));
  } else {
    console.log('--> authenticated!');
    oauth = resp;
    insertLead();
  }
});
