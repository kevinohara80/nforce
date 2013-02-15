var Record = require('../lib/record');
var should = require('should');

var accountRec;

describe('lib/record', function(){ 
  
  beforeEach(function(done){
    accountRec = {
        "attributes": {
            "type": "Account",
            "url": "/services/data/v24.0/sobjects/Account/001Q000000RpQagIAF"
        },
        "Id": "001Q000000RpQagIAF",
        "IsDeleted": false,
        "MasterRecordId": null,
        "Name": "Portal House Account",
        "Type": null,
        "ParentId": null,
        "BillingStreet": null,
        "BillingCity": null,
        "BillingState": null,
        "BillingPostalCode": null,
        "BillingCountry": null,
        "ShippingStreet": null,
        "ShippingCity": null,
        "ShippingState": null,
        "ShippingPostalCode": null,
        "ShippingCountry": null,
        "Phone": null,
        "Fax": null,
        "Website": null,
        "Industry": null,
        "AnnualRevenue": null,
        "NumberOfEmployees": null,
        "Description": null,
        "OwnerId": "00530000004sFb6AAE",
        "CreatedDate": "2012-04-02T23:06:57.000+0000",
        "CreatedById": "00530000004sFb6AAE",
        "LastModifiedDate": "2012-04-02T23:06:57.000+0000",
        "LastModifiedById": "00530000004sFb6AAE",
        "SystemModstamp": "2012-05-03T19:24:28.000+0000",
        "LastActivityDate": "2012-05-03",
        "IsCustomerPortal": true,
        "Jigsaw": null,
        "JigsawCompanyId": null,
        "AccountSource": null,
        "SicDesc": null
    }
    done();
  });

  describe('#constructor', function() {
  
    it('should allow me to set properties', function() {
      var myRecord = new Record(accountRec);
      myRecord.Fax = '248-443-3456';
      myRecord.Fax.should.equal('248-443-3456');
      myRecord.getFieldValues().Fax.should.equal('248-443-3456');
    });
  
    it('should allow me to set properties multiple times', function() {
      var myRecord = new Record(accountRec);
      myRecord.Fax = '248-443-3456';
      myRecord.Fax = '248-443-3457';
      myRecord.Fax = '248-443-3458';
      myRecord.Fax.should.equal('248-443-3458');
      myRecord.getFieldValues().Fax.should.equal('248-443-3458');
    });

    it('should not drop the Id', function() {
      var myRecord = new Record(accountRec);
      myRecord.Id.should.exist;
      myRecord.Id.should.equal('001Q000000RpQagIAF');
      myRecord.getId().should.equal('001Q000000RpQagIAF');
    });

    it('should retain the attributes', function() {
      var myRecord = new Record(accountRec);
      myRecord.attributes.should.exist;
      myRecord.attributes.type.should.equal('Account');
      myRecord.attributes.url.should.equal('/services/data/v24.0/sobjects/Account/001Q000000RpQagIAF');
    });
  
  });

  describe('#getFieldValues', function() {

    it('should have a getFieldValues method', function() {
      var myRecord = new Record(accountRec);
      myRecord.getFieldValues.should.exist;
    });
  
    it('should return existing and custom set properties', function() {
      var myRecord = new Record(accountRec);
      myRecord.Fax = '248-443-3456';
      myRecord.Custom_Field__c = 'This is something';
      myRecord.getFieldValues().should.have.keys('Fax', 'Custom_Field__c');
    });

    it('should return the right number of properties', function() {
      var myRecord = new Record(accountRec);
      myRecord.Fax = '248-443-3456';
      myRecord.Custom_Field__c = 'This is something';
      //myRecord.getFieldValues().length.should.equal(2);
      should.equal(Object.keys(myRecord.getFieldValues()).length, 2);
      myRecord.Phone = '2488843403';
      should.equal(Object.keys(myRecord.getFieldValues()).length, 3);
    });
    
    it('should not contain the Id', function() {
      var myRecord = new Record(accountRec);
      myRecord.Fax = '248-443-3456';
      myRecord.Custom_Field__c = 'This is something';
      myRecord.Id = '001Q000000RpQagIAD';
      myRecord.getFieldValues().should.not.have.keys('Id', 'id', 'ID', 'iD');
    });

    it('should not contain attributes', function() {
      var myRecord = new Record(accountRec);
      myRecord.getFieldValues().should.not.have.keys('attributes');
    });
  
  });

  describe('#getId', function() {
  
    it('should return Id', function() {
      var myRecord = new Record(accountRec);
      myRecord.getId().should.equal('001Q000000RpQagIAF');
    });
    
    it('should return Id from url', function() {
      delete accountRec.Id;
      var myRecord = new Record(accountRec);
      should.exist(myRecord.getId());
      myRecord.getId().should.equal('001Q000000RpQagIAF');
    });
    
    it('should not be ok when no id', function() {
      delete accountRec.Id;
      delete accountRec.attributes.url;
      var myRecord = new Record(accountRec);
      should.not.exist(myRecord.getId());
    });
  
  });
  
  describe('#getExternalId', function() {
    
    it('should return external Id', function() {
      delete accountRec.Id;
      var myRecord = new Record(accountRec);
      myRecord.setExternalId('Custom_Ext__c', 'abc');
      should.exist(myRecord.attributes.externalId);
      myRecord.attributes.externalId.should.equal('abc');
    });
    
    it('should not return external Id with no field set', function() {
      delete accountRec.Id;
      var myRecord = new Record(accountRec);
      myRecord.Custom_Ext__c = 'abc';
      should.not.exist(myRecord.attributes.externalId);
    });
    
    it('should not return external Id with no value set', function() {
      delete accountRec.Id;
      var myRecord = new Record(accountRec);
      myRecord.setExternalId('Custom_Ext__c', null);
      should.not.exist(myRecord.attributes.externalId);
    });
    
  });
  
});