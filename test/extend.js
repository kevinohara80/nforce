var nforce = require('../');
var should = require('should');

describe('index', function() {

  describe('#extend', function() {

    it('should allow extending with functions', function() {

      should.exist(nforce.extend);
      nforce.extend.should.be.a.Function;
      
      nforce.extend('foo', function(){
        return 'bar';
      });

      var org = nforce.createConnection({
        clientId: 'SOME_OAUTH_CLIENT_ID',
        clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
        redirectUri: 'http://localhost:3000/oauth/_callback',
        apiVersion: 'v24.0',  
        environment: 'production'
      });

      should.exist(org.foo);
      org.foo.should.be.a.Function;

      var result = org.foo();

      result.should.equal('bar');

    });

    it('should not allow overriding existing proto', function() {

      should.exist(nforce.extend);
      nforce.extend.should.be.a.Function;

      (function() {
        nforce.extend('query', function() {
          console.log('this is bad');
        });
      }).should.throw();

    });

  }); 

});