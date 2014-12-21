var nforce = require('../');
var http   = require('http');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var port   = process.env.PORT || 3000;
var attId  = '00Pd0000002dsAO'; // this is a png file I attached to a lead

var oauth;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

var server = http.createServer(function(req, res) {
  if(req.url === '/') {
    // example using a callback
    // http://localhost:3000/
    org.getAttachmentBody({ id: attId, oauth: oauth }, function(err, resp) {
      if(err) {
        console.error(err);
        throw(err);
      } else {
        res.writeHead(200, {
          'content-type': 'image/png'
        });
        res.end(resp);
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

console.log('authenticating to salesforce');
org.authenticate({ username: sfuser, password: sfpass }, function(err, resp) {
  if(err) {
    console.error('unable to authenticate to salesforce');
    console.error(err);
  } else {
    oauth = resp;
    server.listen(port);
    console.log('http server listening on port ' + port);
  }
});
