/* jshint -W030 */

var Record = require('../lib/record');
var should = require('should');

// var accountRec;
var accData = {
  attributes: {
    type: 'Account'
  },
  Name: 'Test Account',
  Industry: 'Technology'
};

describe('lib/record', function(){

  beforeEach(function(done){
    done();
  });

  describe('#constructor', function() {

    it('should allow constructing a new sobject w/ no fields', function() {
      var acc = new Record({
        attributes: {
          type: 'Account'
        }
      });
    });

    it('should allow constructing a new sobject w/ fields', function() {
      var acc = new Record({
        attributes: {
          type: 'Account'
        },
        Field__c: 'Foo'
      });
    });

    it('should create the attributes and set the type', function() {
      var acc = new Record(accData);
      acc.attributes.type.should.equal('Account');
    });

    it('should convert keys to lowercase on constructor', function() {
      var acc = new Record(accData);
      Object.keys(acc._fields).forEach(function(key) {
        key.should.equal(key.toLowerCase());
      });
    });

    it('should set fields as changed on constructor', function() {
      var acc = new Record(accData);
      should.exist(acc._changed);
      acc._changed.length.should.equal(2);
    });

    it('should set an empty hash for previous on constructor', function() {
      var acc = new Record(accData);
      acc._previous.should.be.an.Object;
      Object.keys(acc._previous).length.should.equal(0);
    });

    it('should allow me to set properties', function() {

    });

  });

  describe('#get', function() {

    it('should let me get properties', function() {
      var acc = new Record(accData);
      acc.get('Name').should.equal('Test Account');
    });

    it('should let me get properties regardless of case', function() {
      var acc = new Record(accData);
      acc.get('Name').should.equal('Test Account');
      acc.get('name').should.equal('Test Account');
      acc.get('NaMe').should.equal('Test Account');
    });

    it('should return false properties', function() {
      var acc = new Record(accData);
      acc.set('Test', false);
      acc.get('Test').should.equal(false);
      acc.set('Test', 0);
      acc.get('Test').should.equal(0);
    });

  });

  describe('#set', function() {

    it('should let me set properties with (string, string)', function() {
      var acc = new Record(accData);
      acc.set('Name', 'Foo');
      acc.get('Name').should.equal('Foo');
    });

    it('should let me set properties with a hash', function() {
      var acc = new Record(accData);
      acc.set({ Name: 'Foo' });
      acc.get('Name').should.equal('Foo');
    });

    it('should update changed array', function() {
      var acc = new Record({
        attributes: {
          type: 'Account'
        }
      });
      acc.set('Industry', 'Technology');
      acc.get('industry').should.equal('Technology');
      acc._changed.indexOf('industry').should.not.equal(-1);
      acc._changed.length.should.equal(1);
    });

    it('should update the previous hash', function() {
      var acc = new Record(accData);
      acc.set({ Name: 'Foo' });
      acc.get('Name').should.equal('Foo');
      acc._previous['name'].should.equal('Test Account');
    });

  });

  describe('#getType', function() {

    it('should get the type as lowercase', function() {
      var acc = new Record({
        attributes: {
          type: 'Account'
        }
      });
      should.exist(acc.getType());
      acc.getType().should.equal('account');
    });

  });

  describe('#setId', function() {

    it('should let me set the id', function() {
      var acc = new Record(accData);
      acc.setId('12312k21l3j21lk3j1');
      acc._fields.id.should.equal('12312k21l3j21lk3j1');
    });

  });

  describe('#getId', function() {

    it('should let me get the id', function() {
      var acc = new Record({
        attributes: {
          type: 'Account'
        },
        id: 'abc123'
      });
      acc.getId().should.equal('abc123');
    });

  });

  describe('#setExternalId', function() {

    it('should let me set the external id', function() {
      var acc = new Record(accData);
      acc.setExternalId('Field__c', '12312k21l3j21lk3j1');
      acc.attributes.externalId.should.equal('12312k21l3j21lk3j1');
      acc.attributes.externalIdField.should.equal('field__c');
    });

  });

  describe('#getExternalId', function() {

    it('should let me get the external id', function() {
      var acc = new Record(accData);
      acc.setExternalId('Field__c', '12312k21l3j21lk3j1');
      acc.getExternalId().should.equal('12312k21l3j21lk3j1');
    });

  });

  describe('#getExternalIdField', function() {

    it('should let me get the external id field', function() {
      var acc = new Record(accData);
      acc.setExternalId('Field__c', '12312k21l3j21lk3j1');
      acc.getExternalIdField().should.equal('field__c');
    });

  });

  describe('#getUrl', function() {

    it('should let me get the id', function() {
      var acc = new Record({
        attributes: {
          type: 'Account',
          url: 'http://www.salesforce.com'
        },
        id: 'abc123'
      });
      acc.getUrl().should.equal('http://www.salesforce.com');
    });

  });

  describe('#hasChanged', function() {

    it('should return false with no argument and no changes', function() {
      var acc = new Record(accData);
      acc._changed = [];
      acc._previous = {};
      acc.hasChanged().should.equal(false);
    });

    it('should return true with no argument and changes', function() {
      var acc = new Record(accData);
      acc.set('My_field__c', 'test');
      acc.hasChanged().should.equal(true);
    });

    it('should return false for a field that hasnt changed', function() {
      var acc = new Record(accData);
      acc.set('My_field__c', 'test');
      acc.hasChanged('Other_Field__c').should.equal(false);
    });

    it('should return true for a field that has changed', function() {
      var acc = new Record(accData);
      acc.set('My_field__c', 'test');
      acc.hasChanged('My_field__c').should.equal(true);
    });

  });

  describe('#changed', function() {

    it('should return an empty hash with no changes', function() {
      var acc = new Record(accData);
      acc._changed = [];
      acc._previous = {};
      Object.keys(acc.changed()).length.should.equal(0);
    });

    it('should return a hash with changes', function() {
      var acc = new Record(accData);
      Object.keys(acc.changed()).length.should.equal(2);
      acc.set('My_field__c', 'foo');
      Object.keys(acc.changed()).length.should.equal(3);
    });

  });

  describe('#previous', function() {

    it('should return an empty hash with no previous values', function() {
      var acc = new Record(accData);
      Object.keys(acc.previous()).length.should.equal(0);
    });

    it('should return a hash with previous values', function() {
      var acc = new Record(accData);
      Object.keys(acc.previous()).length.should.equal(0);
      acc.set('Name', 'foo');
      Object.keys(acc.previous()).length.should.equal(1);
      should.exist(acc.previous['name']);
      acc.previous()['name'].should.equal('Test Account');
    });

    it('should return undefined for previous values not found', function() {
      var acc = new Record(accData);
      Object.keys(acc.previous()).length.should.equal(0);
      acc.set('Name', 'foo');
      Object.keys(acc.previous()).length.should.equal(1);
      should.not.exist(acc.previous('Test_Field__c'));
    });

    it('should return the value for previous values found', function() {
      var acc = new Record(accData);
      Object.keys(acc.previous()).length.should.equal(0);
      acc.set('Name', 'foo');
      Object.keys(acc.previous()).length.should.equal(1);
      should.exist(acc.previous['name']);
      acc.previous('name').should.equal('Test Account');
    });

  });

  describe('#toJSON', function() {

    it('should return the data as JSON', function() {
      var acc = new Record(accData);
      Object.keys(acc.toJSON()).length.should.equal(2);
    });

  });

  describe('#_reset', function() {

    it('should reset the cache when calling _reset', function() {
      var acc = new Record(accData);
      Object.keys(acc.changed()).length.should.equal(2);
      acc._reset();
      Object.keys(acc.changed()).length.should.equal(0);
    });

  });

  describe('#_getPayload', function() {

    it('should return all fields when changedOnly is false', function() {
      var acc = new Record(accData);
      acc._changed = [];
      acc._previous = {};
      Object.keys(acc._getPayload(false)).length.should.equal(2);
    });

    it('should return changed fields only when changedOnly is true', function() {
      var acc = new Record(accData);
      acc._changed = [];
      acc._previous = {};
      acc.set('MyField__c', 'test');
      Object.keys(acc._getPayload(true)).length.should.equal(1);
    });

    it('should return all fields only when changedOnly is not specified', function() {
      var acc = new Record(accData);
      acc._changed = [];
      acc._previous = {};
      acc.set('MyField__c', 'test');
      Object.keys(acc._getPayload()).length.should.equal(3);
    });

    it('should not return the external id with the other fields', function() {
      var acc = new Record(accData);
      acc.setExternalId('MyExtId__c', 'Blah');
      acc._getPayload(false).should.exist;
      acc._getPayload(false).should.have.keys('name', 'industry');
      acc._getPayload(false).should.not.have.keys('myextid__c');
    });

  });

});
