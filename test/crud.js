var nforce = require('../');
var should = require('should');
var api    = require('./mock/sfdc-rest-api');
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
      var hs = {
        'sforce-auto-assign': '1'
      };
      org.insert({ sobject: obj, oauth: oauth, headers: hs }, function(err, res) {
        if(err) throw err;
        var body = JSON.parse(api.getLastRequest().body);
        should.exist(body.name);
        should.exist(body.test_field__c);
        api.getLastRequest().url.should.equal('/services/data/v27.0/sobjects/account');
        api.getLastRequest().method.should.equal('POST');
        var hKey = Object.keys(hs)[0];
        should.exist(api.getLastRequest().headers[hKey]);
        api.getLastRequest().headers[hKey].should.equal(hs[hKey]);
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
      obj.setId('someid');
      org.update({ sobject: obj, oauth: oauth }, function(err, res) {
        if(err) throw err;
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
      obj.setExternalId('My_Ext_Id__c', 'abc123');
      org.upsert({ sobject: obj, oauth: oauth }, function(err, res) {
        if(err) throw err;
        var body = JSON.parse(api.getLastRequest().body);
        should.exist(body.name);
        should.exist(body.test_field__c);
        api.getLastRequest().url.should.equal('/services/data/v27.0/sobjects/account/my_ext_id__c/abc123');
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
      obj.setId('someid');
      org.delete({ sobject: obj, oauth: oauth }, function(err, res) {
        if(err) throw err;
        api.getLastRequest().url.should.equal('/services/data/v27.0/sobjects/account/someid');
        api.getLastRequest().method.should.equal('DELETE');
        done();
      });
    });

  });

  describe('#apexRest', function() {

    it('should create a proper request for a custom Apex REST endpoint', function(done) {
      org.apexRest({ uri: 'sample', oauth: oauth }, function(err, res) {
        api.getLastRequest().url.should.equal('/services/apexrest/sample');
        api.getLastRequest().method.should.equal('GET');
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
