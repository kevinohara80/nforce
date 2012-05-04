var nforce = require('../');

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
  
  it('should throw for apiVersion 25', function(){
    (function() {
      var org = nforce.createConnection({
        clientId: 'ADFJSD234ADF765SFG55FD54S',
        clientSecret: 'ADFJSD234ADF765SFG55FD54S',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        apiVersion: 25.0
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