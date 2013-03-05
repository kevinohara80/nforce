var nforce = require('../');
var fs     = require('fs');
var path   = require('path');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

org.authenticate({ username: sfuser, password: sfpass}, function(err, oauth) {
  if(err) {
    console.error('unable to authenticate to sfdc');
  } else {
    var docPath = path.resolve(__dirname, './documents/testdoc.docx');
    
    var doc = nforce.createSObject('Document', {
      Name: 'testdoc',
      Description: 'This is a test doc',
      FolderId: '005d00000014XTP',
      Type: 'docx',
      attachment: {
        fileName: 'testdoc.docx',
        body: fs.readFileSync(docPath)
      }
    });

    org.insert(doc, oauth, function(err, resp) {
      if(err) {
        return console.error(err);
      } else {
        return console.log(resp);
      }
    });

  }

});