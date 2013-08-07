var nforce = require('../');

describe('index', function(){ 

  describe('#createConnection', function(){
  
    it('should throw on no clientId', function(){
      (function() {
        var org = nforce.createConnection({
          clientSecret: 'ADFJSD234ADF765SFG55FD54S',
          redirectUri: 'http://localhost:3000/oauth/_callback'
        });
      }).should.throw('Invalid or missing clientId');
    });
  
    it('should throw on no clientSecret', function(){
      (function() {
        var org = nforce.createConnection({
          clientId: 'ADFJSD234ADF765SFG55FD54S',
          redirectUri: 'http://localhost:3000/oauth/_callback'
        });
      }).should.throw('Invalid or missing clientSecret');
    });
  
    it('should throw on no redirectUri', function(){
      (function() {
        var org = nforce.createConnection({
          clientId: 'ADFJSD234ADF765SFG55FD54S',
          clientSecret: 'ADFJSD234ADF765SFG55FD54S'
        });
      }).should.throw('Invalid or missing redirectUri');
    });
  
    it('should not throw on id, secret, and redirectUri', function(){
      (function() {
        var org = nforce.createConnection({
          clientId: 'ADFJSD234ADF765SFG55FD54S',
          clientSecret: 'ADFJSD234ADF765SFG55FD54S',
          redirectUri: 'http://localhost:3000/oauth/_callback'
        });
      }).should.not.throw();
    });
  
    it('should accept the number 24 for apiVersion', function(){
      (function() {
        var org = nforce.createConnection({
          clientId: 'ADFJSD234ADF765SFG55FD54S',
          clientSecret: 'ADFJSD234ADF765SFG55FD54S',
          redirectUri: 'http://localhost:3000/oauth/_callback',
          apiVersion: 24
        });
      }).should.not.throw();
    });
  
    it('should accept the string 24 for apiVersion', function(){
      (function() {
        var org = nforce.createConnection({
          clientId: 'ADFJSD234ADF765SFG55FD54S',
          clientSecret: 'ADFJSD234ADF765SFG55FD54S',
          redirectUri: 'http://localhost:3000/oauth/_callback',
          apiVersion: '24'
        });
      }).should.not.throw();
    });
  
    it('should throw for apiVersion 45', function(){
      (function() {
        var org = nforce.createConnection({
          clientId: 'ADFJSD234ADF765SFG55FD54S',
          clientSecret: 'ADFJSD234ADF765SFG55FD54S',
          redirectUri: 'http://localhost:3000/oauth/_callback',
          apiVersion: 45.0
        });
      }).should.throw();
    });
  
    it('should accept production for environment', function(){
      (function() {
        var org = nforce.createConnection({
          clientId: 'ADFJSD234ADF765SFG55FD54S',
          clientSecret: 'ADFJSD234ADF765SFG55FD54S',
          redirectUri: 'http://localhost:3000/oauth/_callback',
          environment: 'production'
        });
      }).should.not.throw();
    });
  
    it('should accept sandbox for environment', function(){
       (function() {
         var org = nforce.createConnection({
           clientId: 'ADFJSD234ADF765SFG55FD54S',
           clientSecret: 'ADFJSD234ADF765SFG55FD54S',
           redirectUri: 'http://localhost:3000/oauth/_callback',
           environment: 'sandbox'
         });
       }).should.not.throw();
     });
   
     it('should not accept playground for environment', function(){
        (function() {
          var org = nforce.createConnection({
            clientId: 'ADFJSD234ADF765SFG55FD54S',
            clientSecret: 'ADFJSD234ADF765SFG55FD54S',
            redirectUri: 'http://localhost:3000/oauth/_callback',
            environment: 'playground'
          });
        }).should.throw();
      });
  
  });
  
  describe('#createSObject', function(){
    
    it('should create an SObject of type Account', function(){
      var acc = nforce.createSObject('Account');
      acc.should.be.a('object');
      acc.should.have.property('attributes');
      acc.attributes.type.should.equal('Account');
    });
    
    it('should create an SObject of type Test_Object__c', function(){
      var obj = nforce.createSObject('Test_Object__c');
      obj.should.be.a('object');
      obj.should.have.property('attributes');
      obj.attributes.type.should.equal('Test_Object__c');
    });
    
    it('should allow field values to be passed in', function(){
      var obj = nforce.createSObject('Test_Object__c', {
        Name: 'Test Me',
        Custom_Field__c: 'Blah'
      });
      obj.should.be.a('object');
      obj.should.have.property('attributes');
      obj.attributes.type.should.equal('Test_Object__c');
      obj.should.have.property('Name');
      obj.Name.should.equal('Test Me');
      obj.should.have.property('Custom_Field__c');
      obj.Custom_Field__c.should.equal('Blah');
      var fv = obj.getFieldValues();
      fv.should.have.property('Name', 'Test Me');
      fv.should.have.property('Custom_Field__c', 'Blah');
    });

    it('should allow instantiation with id', function() {
      var obj = nforce.createSObject('Test_Object__c', {
        Name: 'Test Me',
        Custom_Field__c: 'Blah',
        Id: 'asalesforceid'
      });
      obj.should.have.property('Id');
      obj.Id.should.equal('asalesforceid');
    });

    it('should clear the cache after calling getFieldValues', function() {
      var obj = nforce.createSObject('Test_Object__c', {
        Name: 'Test Me',
        Custom_Field__c: 'Blah',
        Id: 'asalesforceid'
      });
      var fvBefore = obj.getFieldValues();
      var fvAfter = obj.getFieldValues();
      fvBefore.should.have.keys('Name', 'Custom_Field__c');
      fvAfter.should.not.have.keys('Name', 'Custom_Field__c', 'Id');
    });
    
  });

  describe('#getAuthUri', function() {

    it('should return the correct authuri for production', function() {
      var org = nforce.createConnection({
        clientId: 'ADFJSD234ADF765SFG55FD54S',
        clientSecret: 'ADFJSD234ADF765SFG55FD54S',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        environment: 'production'
      });
      var uri = org.getAuthUri();
      uri.should.match(/^https:\/\/login.salesforce.*/);
    });

    it('should return the correct authuri for sandbox', function() {
      var org = nforce.createConnection({
        clientId: 'ADFJSD234ADF765SFG55FD54S',
        clientSecret: 'ADFJSD234ADF765SFG55FD54S',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        environment: 'sandbox'
      });
      var uri = org.getAuthUri();
      uri.should.match(/^https:\/\/test.salesforce.*/);
    });

    it('should allow for setting display', function() {
      var org = nforce.createConnection({
        clientId: 'ADFJSD234ADF765SFG55FD54S',
        clientSecret: 'ADFJSD234ADF765SFG55FD54S',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        environment: 'production'
      });
      var uri = org.getAuthUri({ display: 'popup' });
      uri.should.match(/.*display\=popup*/);
    });

    it('should allow for setting immediate', function() {
      var org = nforce.createConnection({
        clientId: 'ADFJSD234ADF765SFG55FD54S',
        clientSecret: 'ADFJSD234ADF765SFG55FD54S',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        environment: 'production'
      });
      var uri = org.getAuthUri({ immediate: true });
      uri.should.match(/.*immediate\=true*/);
    });

    it('should allow for setting scope', function() {
      var org = nforce.createConnection({
        clientId: 'ADFJSD234ADF765SFG55FD54S',
        clientSecret: 'ADFJSD234ADF765SFG55FD54S',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        environment: 'production'
      });
      var uri = org.getAuthUri({ scope: [ 'visualforce', 'web' ] });
      uri.should.match(/.*scope=visualforce\%20web.*/);
    });

    it('should allow for setting state', function() {
      var org = nforce.createConnection({
        clientId: 'ADFJSD234ADF765SFG55FD54S',
        clientSecret: 'ADFJSD234ADF765SFG55FD54S',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        environment: 'production'
      });
      var uri = org.getAuthUri({ state: 'something' });
      uri.should.match(/.*state=something.*/);
    });

  });

});