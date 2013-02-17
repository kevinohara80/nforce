var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var oauth;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

function deleteLead(id) {
  var ld = nforce.createSObject('Lead', { id: id });

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

function updateLead(id) {
  var ld = nforce.createSObject('Lead', { id: id });
  ld.Company = 'JJ Inc.';

  console.log('attempting to update lead')

  org.update(ld, oauth, function(err, resp) {
    if(err) {
      console.error('--> unable to update lead');
      console.error('--> ' + JSON.stringify(err));
    } else {
      console.log('--> lead updated');
      deleteLead(id);
    }
  });
}

function insertLead() {
  var ld = nforce.createSObject('Lead', {
    FirstName: 'Bobby',
    LastName: 'Tester',
    Company: 'ABC Widgets',
    Email: 'bobbytester@testertest.com'
  });

  console.log('Attempting to insert lead');

  org.insert(ld, oauth, function(err, resp) {
    if(err) {
      console.error('--> unable to insert lead');
      console.error('--> ' + JSON.stringify(err));
    } else {
      console.log('--> lead inserted');
      console.log('--> ' + JSON.stringify(resp));
      updateLead(resp.id);
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