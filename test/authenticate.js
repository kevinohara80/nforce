var nforce = require('../');
var should = require('should');
var fakeweb = require('node-fakeweb');

function setFakewebResponse(options){
  fakeweb.allowNetConnect = false;
  fakeweb.registerUri({
    uri: options.uri || 'https://login.salesforce.com:443/services/oauth2/token',
    statusCode: options.statusCode,
    body: options.body
  });
};

function createConnection(options){
  return nforce.createConnection({
    clientId: 'SOME_OAUTH_CLIENT_ID',
    clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
    redirectUri: 'http://localhost:3000/oauth/_callback',
    apiVersion: 'v24.0',  
    environment: options.environment || 'production',
    mode: options.mode,
    loginUri: options.loginUri,
    testLoginUri: options.testLoginUri
  });
};

describe('Connection #authenticate', function(){ 
  var org;
  
  beforeEach(function(done){
    org = createConnection({});
    done();
  });

  it('should return error with no OAuth', function(done){
    org.authenticate({}, function(err, res){
      should.exist(err);
      done();
    });
  });

  describe('with a 200 response code', function(){

    it('parses the response body', function(done){
      setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.authenticate({code: 'foo'}, function(err, res){
        should.not.exist(err);
        res.responseKey.should.equal("responseValue");
        done();
      });
    });
  
    it('sets oauth to the body when mode is single', function(done){
      org = createConnection({mode: 'single'});
      setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.authenticate({code: 'foo'}, function(err, res){
        org.oauth.responseKey.should.equal('responseValue');
        done();
      });
    });
  
    it('responds with error when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 200, body: '<html></html>'});
      org.authenticate({code: 'foo'}, function(err, res){
        err.should.match(/unparsable json/i);
        res.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 200, body: '<html></html>'});
      org.authenticate({code: 'foo'}, function(err, res){
        err.statusCode.should.equal(200);
        done();
      });
    });

  });

  describe('with a non-200 response code', function(){

    it('returns without body', function(done){
      setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.authenticate({code: 'foo'}, function(err, res){
        should.not.exist(res);
        done();
      });
    });

    it('parses the response body', function(done){
      setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.authenticate({code: 'foo'}, function(err, res){
        err.should.match(/errorValue/);
        done();
      });
    });

    it('sets a status code on the error', function(done){
      setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.authenticate({code: 'foo'}, function(err, res){
        err.statusCode.should.equal(400);
        done();
      });
    });

    it('responds with specific error when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 400, body: '<html></html>'});
      org.authenticate({code: 'foo'}, function(err, res){
        err.should.match(/unparsable json/i);
        res.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 400, body: '<html></html>'});
      org.authenticate({code: 'foo'}, function(err, res){
        err.statusCode.should.equal(400);
        done();
      });
    });

  });

  it('returns the original error', function(done){
    org = createConnection({loginUri: 'bad uri'});
    setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
    org.authenticate({code: 'foo'}, function(err, res){
      should.exist(err);
      should.not.exist(res);
      done();
    });
  });

  it('uses the test uri when sandbox environment is specified', function(done){
    org = createConnection({testLoginUri: 'http://hello/', environment: 'sandbox'});
    setFakewebResponse({uri: 'http://hello:80/', statusCode: 200, body: '{"responseKey":"responseValue"}'});
    org.authenticate({code: 'foo'}, function(err, res){
      should.not.exist(err);
      res.responseKey.should.equal( "responseValue" );
      done();
    });
  });
  
});
