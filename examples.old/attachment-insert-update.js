var nforce  = require('../');
var fs      = require('fs');
var path    = require('path');
var sfuser  = process.env.SFUSER;
var sfpass  = process.env.SFPASS;
var docPath = path.resolve(__dirname, './documents/testdoc.docx');

var oauth;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

function updateAttachment(att) {
  console.log('Updating attachment');
  att.setBody(fs.readFileSync(docPath));
  console.log(att._getPayload(true));
  
  org.update({ sobject: att, oauth: oauth }, function(err, res) {
    if(err) return console.error(err);
    console.log('[OK] updated!');
  });

}

function attachDocument(leadId) { 
  console.log('Creating attachment');
  var att = nforce.createSObject('Attachment', {
    Name: 'TestDocument',
    Description: 'This is a test document',
    ParentId: leadId,
    attachment: {
      fileName: 'testdoc.docx',
      body: fs.readFileSync(docPath)
    }
  });
  org.insert({ sobject: att, oauth: oauth }, function(err, resp) {
    if(err) return console.error(err);
    console.log('[OK] attached!');
    updateAttachment(att);
  });
}

function findALead() {
  console.log('Finding a lead to attach to');
  var q = 'SELECT Id, LastName FROM Lead LIMIT 1';
  org.query({ query: q, oauth: oauth }, function(err, res) {
    if(err) throw err;
    console.log('Attaching to Lead: ' + res.records[0].get('lastname'));
    attachDocument(res.records[0].getId());
  });
}

// start
console.log('Authenticating with SFDC');
org.authenticate({ username: sfuser, password: sfpass}, function(err, res) {
  if(err) return console.error('unable to authenticate to sfdc');
  oauth = res;
  findALead();
});