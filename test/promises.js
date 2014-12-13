var nforce = require('../');
var should = require('should');
var api    = require('./mock/sfdc-rest-api');

var org = nforce.createConnection(api.getClient());
var oauth = api.getOAuth();

var testCallback = function() {};

var testAccount = nforce.createSObject('Account', {
  name: 'MyAccount'
});

var testQuery = 'SELECT Id FROM Account';
var testSearch = 'FIND {Joe Smith} IN Name Fields RETURNING lead';

describe('promises', function() {

  before(function(done) {
    api.start(3000, done);
  });

  describe('#getIdentity', function(){

    it('should not return a promise with a callback', function(){
      var promise = org.getIdentity({ oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.getIdentity({ oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#getVersions', function(){

    it('should not return a promise with a callback', function(){
      var promise = org.getVersions(testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.getVersions();
      should.exist(promise);
    });

  });

  describe('#insert', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.insert({ sobject: testAccount, oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.insert({ sobject: testAccount, oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#update', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.update({ sobject: testAccount, oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.update({ sobject: testAccount, oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#upsert', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.upsert({ sobject: testAccount, oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.upsert({ sobject: testAccount, oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#delete', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.delete({ sobject: testAccount, oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.delete({ sobject: testAccount, oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#getRecord', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.getRecord({ type: 'Account', id: 'Id', oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.getRecord({ type: 'Account', id: 'Id', oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#getBody', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.getBody({ type: 'Document', id: 'Id', oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.getBody({ type: 'Document', id: 'Id', oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#query', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.query({ query: testQuery, oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.query({ query: testQuery, oauth: oauth });
      should.exist(promise);
    });

  });

  describe('#search', function() {

    it('should not return a promise with a callback', function(){
      var promise = org.search({ search: testSearch, oauth: oauth }, testCallback);
      should.not.exist(promise);
    });

    it('should return a promise with no callback', function(){
      var promise = org.search({ search: testSearch, oauth: oauth });
      should.exist(promise);
    });

  });


  after(function(done) {
    api.stop(done);
  });

});
