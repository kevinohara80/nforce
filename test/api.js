var nforce = require('../');
var http   = require('http');
var port   = process.env.PORT || 3000;

var server;
var lastRequest;

var org = nforce.createConnection({
  clientId: 'ADFJSD234ADF765SFG55FD54S',
  clientSecret: 'adsfkdsalfajdskfa',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

var oauth = { 
  id: 'http://localhost: ' + port + '/id/00Dd0000000fOlWEAU/005d00000014XTPAA2',
  issued_at: '1362448234803',
  instance_url: 'http://localhost:' + port,
  signature: 'djaflkdjfdalkjfdalksjfalkfjlsdj',
  access_token: 'aflkdsjfdlashfadhfladskfjlajfalskjfldsakjf' 
}

describe('api', function() {

  // set up mock server
  before(function(done) {
    server = http.createServer(function(req, res) {
      lastRequest = req;
      res.writeHead(200, { 
        'Content-Type': 'application/json'
      });
      res.end();    
    });
    server.listen(port, done);
  });

  describe('#insert', function() {

    it('should create a proper request on insert', function(done) {
      var obj = nforce.createSObject('Account', {
        Name: 'Test Account',
        Test_Field__c: 'blah'
      });
      org.insert(obj, oauth, function(err, res) {
        lastRequest.url.should.equal('/services/data/v27.0/sobjects/account');
        lastRequest.method.should.equal('POST');
        done();
      });
    });

  });
  
  describe('#update', function() {

    it('should create a proper request on update', function(done) {
      var obj = nforce.createSObject('Account', {
        Name: 'Test Account',
        Test_Field__c: 'blah'
      });
      obj.Id = 'someid';
      org.update(obj, oauth, function(err, res) {
        lastRequest.url.should.equal('/services/data/v27.0/sobjects/account/someid');
        lastRequest.method.should.equal('PATCH');
        done();
      });
    });

  });

  describe('#delete', function() {

    it('should create a proper request on delete', function(done) {
      var obj = nforce.createSObject('Account', {
        Name: 'Test Account',
        Test_Field__c: 'blah'
      });
      obj.Id = 'someid';
      org.delete(obj, oauth, function(err, res) {
        lastRequest.url.should.equal('/services/data/v27.0/sobjects/account/someid');
        lastRequest.method.should.equal('DELETE');
        done();
      });
    });

  });


  // close mock server
  after(function(done) {
    server.close(done);
  });

}); 