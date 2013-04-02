var nforce = require('../');
var api = require('./mock/sfdc-rest-api');
var port   = process.env.PORT || 3000;

var server;
var lastRequest;

var org = nforce.createConnection(api.getClient());

var oauth = api.getOAuth();

describe('api-mock-crud', function() {

  // set up mock server
  before(function(done) {
    api.start(port, done);
  });

  describe('#insert', function() {

    it('should create a proper request on insert', function(done) {
      var obj = nforce.createSObject('Account', {
        Name: 'Test Account',
        Test_Field__c: 'blah'
      });
      org.insert(obj, oauth, function(err, res) {
        api.getLastRequest().url.should.equal('/services/data/v27.0/sobjects/account');
        api.getLastRequest().method.should.equal('POST');
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
        api.getLastRequest().url.should.equal('/services/data/v27.0/sobjects/account/someid');
        api.getLastRequest().method.should.equal('PATCH');
        done();
      });
    });

  });

  describe('#upsert', function() {

    it('should create a proper request on upsert', function(done) {
      var obj = nforce.createSObject('Account', {
        Name: 'Test Account',
        Test_Field__c: 'blah'
      });
      obj.setExternalId('My_Ext_Id__c', 'abc123')
      org.upsert(obj, oauth, function(err, res) {
        var body = JSON.parse(api.getLastRequest().body);
        body.Name.should.exist;
        body.Test_Field__c.should.exist;
        api.getLastRequest().url.should.equal('/services/data/v27.0/sobjects/account/My_Ext_Id__c/abc123');
        api.getLastRequest().method.should.equal('PATCH');
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
        api.getLastRequest().url.should.equal('/services/data/v27.0/sobjects/account/someid');
        api.getLastRequest().method.should.equal('DELETE');
        done();
      });
    });

  });

  // reset the lastRequest
  afterEach(function() {
    api.reset();
  });

  // close mock server
  after(function(done) {
    api.stop(done);
  });

}); 