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
  att.attachment.body = fs.readFileSync(docPath);
  
  org.update(att, oauth, function(err, res) {
    if(err) console.log(err);
    else console.log('OK');
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
  org.insert(att, oauth, function(err, resp) {
    if(err) console.error(err);
    else {
      console.log(resp);
      updateAttachment(att);
    }
  });
}

function findALead() {
  console.log('Finding a lead to attach to');
  var q = 'SELECT Id, LastName FROM Lead LIMIT 1';
  org.query(q, oauth, function(err, res) {
    if(err) return console.error(err);
    if(!res.records || !res.records.length) return console.error('No leads');
    console.log('Attaching to Lead: ' + res.records[0].LastName);
    attachDocument(res.records[0].Id);
  });
}

// start
console.log('Authenticating with SFDC');
org.authenticate({ username: sfuser, password: sfpass}, function(err, res) {
  if(err) return console.error('unable to authenticate to sfdc');
  oauth = res;
  console.log(oauth);
  findALead();
});