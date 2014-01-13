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
  
//   beforeEach(function(done){
//     accountRec = {
//         "attributes": {
//             "type": "Account",
//             "url": "/services/data/v24.0/sobjects/Account/001Q000000RpQagIAF"
//         },
//         "Id": "001Q000000RpQagIAF",
//         "IsDeleted": false,
//         "MasterRecordId": null,
//         "Name": "Portal House Account",
//         "Type": null,
//         "ParentId": null,
//         "BillingStreet": null,
//         "BillingCity": null,
//         "BillingState": null,
//         "BillingPostalCode": null,
//         "BillingCountry": null,
//         "ShippingStreet": null,
//         "ShippingCity": null,
//         "ShippingState": null,
//         "ShippingPostalCode": null,
//         "ShippingCountry": null,
//         "Phone": null,
//         "Fax": null,
//         "Website": null,
//         "Industry": null,
//         "AnnualRevenue": null,
//         "NumberOfEmployees": null,
//         "Description": null,
//         "OwnerId": "00530000004sFb6AAE",
//         "CreatedDate": "2012-04-02T23:06:57.000+0000",
//         "CreatedById": "00530000004sFb6AAE",
//         "LastModifiedDate": "2012-04-02T23:06:57.000+0000",
//         "LastModifiedById": "00530000004sFb6AAE",
//         "SystemModstamp": "2012-05-03T19:24:28.000+0000",
//         "LastActivityDate": "2012-05-03",
//         "IsCustomerPortal": true,
//         "Jigsaw": null,
//         "JigsawCompanyId": null,
//         "AccountSource": null,
//         "SicDesc": null
//     }
//     done();
//   });

//   describe('#constructor', function() {
  
//     it('should allow me to set properties', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.Fax = '248-443-3456';
//       myRecord.Fax.should.equal('248-443-3456');
//       myRecord.getFieldValues().Fax.should.equal('248-443-3456');
//     });
  
//     it('should allow me to set properties multiple times', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.Fax = '248-443-3456';
//       myRecord.Fax = '248-443-3457';
//       myRecord.Fax = '248-443-3458';
//       myRecord.Fax.should.equal('248-443-3458');
//       myRecord.getFieldValues().Fax.should.equal('248-443-3458');
//     });

//     it('should not drop the Id', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.Id.should.exist;
//       myRecord.Id.should.equal('001Q000000RpQagIAF');
//       myRecord.getId().should.equal('001Q000000RpQagIAF');
//     });

//     it('should retain the attributes', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.attributes.should.exist;
//       myRecord.attributes.type.should.equal('Account');
//       myRecord.attributes.url.should.equal('/services/data/v24.0/sobjects/Account/001Q000000RpQagIAF');
//     });
  
//   });

//   describe('#getFieldValues', function() {

//     it('should have a getFieldValues method', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.getFieldValues.should.exist;
//     });
  
//     it('should return existing and custom set properties', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.Fax = '248-443-3456';
//       myRecord.Custom_Field__c = 'This is something';
//       myRecord.getFieldValues().should.have.keys('Fax', 'Custom_Field__c');
//     });

//     it('should return the right number of properties', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.Fax = '248-443-3456';
//       myRecord.Custom_Field__c = 'This is something';
//       //myRecord.getFieldValues().length.should.equal(2);
//       should.equal(Object.keys(myRecord.getFieldValues()).length, 2);
//     });
    
//     it('should not contain the Id', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.Fax = '248-443-3456';
//       myRecord.Custom_Field__c = 'This is something';
//       myRecord.Id = '001Q000000RpQagIAD';
//       myRecord.getFieldValues().should.not.have.keys('Id', 'id', 'ID', 'iD');
//     });

//     it('should not contain attributes', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.getFieldValues().should.not.have.keys('attributes');
//     });

//     it('should not return attachment data adding after create', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.attachment = {
//         contentType: 'application.pdf',
//         fileName: 'mytest.pdf',
//         body: 'dfslfjsdfjds'
//       }
//       myRecord.getFieldValues().should.not.have.keys('attachment');
//     });

//     it('should clear the cache after calling it once', function(){
//       var myRecord = new Record(accountRec);
//       myRecord.Test_Field__c = 'blah';
//       var fvBefore = myRecord.getFieldValues();
//       var fvAfter = myRecord.getFieldValues();
//       fvBefore.should.have.keys('Test_Field__c');
//       fvAfter.should.not.have.keys('Test_Field__c');
//       should.equal(0, Object.keys(fvAfter).length);
//     });

//     it('should create a new cache', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.Test_Field__c = 'blah';
//       var fvClear = myRecord.getFieldValues();
//       myRecord.Test_Field2__c = 'foo';
//       var fvAfter = myRecord.getFieldValues();
//       fvClear.should.have.keys('Test_Field__c');
//       fvClear.should.not.have.keys('Test_Field2__c');
//       fvAfter.should.have.keys('Test_Field2__c');
//       fvAfter.should.not.have.keys('Test_Field__c');
//       fvAfter.Test_Field2__c.should.equal('foo');
//     });
  
//   });

//   describe('#getId', function() {
  
//     it('should return Id', function() {
//       var myRecord = new Record(accountRec);
//       myRecord.getId().should.equal('001Q000000RpQagIAF');
//     });
    
//     it('should return Id from url', function() {
//       delete accountRec.Id;
//       var myRecord = new Record(accountRec);
//       should.exist(myRecord.getId());
//       myRecord.getId().should.equal('001Q000000RpQagIAF');
//     });
    
//     it('should not be ok when no id', function() {
//       delete accountRec.Id;
//       delete accountRec.attributes.url;
//       var myRecord = new Record(accountRec);
//       should.not.exist(myRecord.getId());
//     });
  
//   });
  
//   describe('#getExternalId', function() {
    
//     it('should return external Id', function() {
//       delete accountRec.Id;
//       var myRecord = new Record(accountRec);
//       myRecord.setExternalId('Custom_Ext__c', 'abc');
//       should.exist(myRecord.attributes.externalId);
//       myRecord.attributes.externalId.should.equal('abc');
//     });
    
//     it('should not return external Id with no field set', function() {
//       delete accountRec.Id;
//       var myRecord = new Record(accountRec);
//       myRecord.Custom_Ext__c = 'abc';
//       should.not.exist(myRecord.attributes.externalId);
//     });
    
//     it('should not return external Id with no value set', function() {
//       delete accountRec.Id;
//       var myRecord = new Record(accountRec);
//       myRecord.setExternalId('Custom_Ext__c', null);
//       should.not.exist(myRecord.attributes.externalId);
//     });
    
//   });


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

    it('should return the external id with the other fields', function() {
      var acc = new Record(accData);
      acc.setExternalId('MyExtId__c', 'Blah');
      acc._getPayload(false).should.exist;
      acc._getPayload(false).should.have.keys('myextid__c', 'name', 'industry');
    });

    it('should return only external id with requesting changed only', function() {
      var acc = new Record(accData);
      acc._reset();
      acc.setExternalId('MyExtId__c', 'Blah');
      acc._getPayload(true).should.exist;
      acc._getPayload(true).should.have.keys('myextid__c');
      acc._getPayload(true).should.not.have.keys('name', 'industry');
    });

  });
  
});