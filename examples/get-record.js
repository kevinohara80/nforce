var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var oauth;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});


function getRecord(id) {
  console.log('attempting to get the lead');
  org.getRecord({ type: 'lead', id: id, oauth: oauth }, function(err, ld) {
    if(err) {
      console.error('--> unable to retrieve lead');
      console.error('--> ' + JSON.stringify(err));
    } else {
      console.log('--> lead retrieved');
      ld.set('firstname', 'Terry');
      console.log('changed: ' + JSON.stringify(ld.changed(), '  '));
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
  org.insert({ sobject: ld, oauth: oauth }, function(err, resp) {
    if(err) {
      console.error('--> unable to insert lead');
      console.error('--> ' + JSON.stringify(err));
    } else {
      console.log('--> lead inserted');
      console.log(JSON.stringify(resp, '  '));
      console.log('--> lead.Id: ' + resp.id);
      getRecord(resp.id);
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
