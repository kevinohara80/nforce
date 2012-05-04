var Record = require('../lib/record');

var accountRec = {
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

describe('#constructor', function() {
  
  it('should allow me to set properties', function() {

    var myRecord = new Record(accountRec);

    myRecord.Fax = '248-443-3456';

    myRecord.Fax.should.equal('248-443-3456');
    myRecord.fieldValues.Fax.should.equal('248-443-3456');
    
  });
  
  it('should allow me to set properties multiple times', function() {

    var myRecord = new Record(accountRec);

    myRecord.Fax = '248-443-3456';
    myRecord.Fax = '248-443-3457';
    myRecord.Fax = '248-443-3458';

    myRecord.Fax.should.equal('248-443-3458');
    myRecord.fieldValues.Fax.should.equal('248-443-3458');
    
  });
  
});

describe('#getFieldValues', function() {
  
  it('should return existing and custom set properties', function() {

    var myRecord = new Record(accountRec);
    
    // set a new Fax
    myRecord.Fax = '248-443-3456';
    myRecord.Custom_Field__c = 'This is something';
    
    myRecord.getFieldValues().should.have.keys('Fax', 'Custom_Field__c');
    
  });
  
});
