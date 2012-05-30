var nforce = require('../');
var should = require('should');
var org;

describe('index', function(){ 
  
  beforeEach(function(done){
    org = nforce.createConnection({
      clientId: 'SOME_OAUTH_CLIENT_ID',
      clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
      redirectUri: 'http://localhost:3000/oauth/_callback',
      apiVersion: 'v24.0',  
      environment: 'production'
    });
    done();
  });
  
  describe('#query', function(){
  
    it('should return error with no OAuth', function(done){
      org.query('SELECT Id FROM Account', null, function(err, res){
         should.exist(err);
         done();
      });
    });
    
  });
  
});