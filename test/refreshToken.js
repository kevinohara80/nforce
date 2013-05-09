var nforce = require('../');
var should = require('should');
var fakeweb = require('node-fakeweb');

function setFakewebResponse(options){
  fakeweb.allowNetConnect = false;
  fakeweb.registerUri({
    uri: 'https://login.salesforce.com:443/services/oauth2/token',
    statusCode: options.statusCode,
    body: options.body
  });
};

function createConnection(options){
  var org = nforce.createConnection({
    clientId: 'SOME_OAUTH_CLIENT_ID',
    clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
    redirectUri: 'http://localhost:3000/oauth/_callback',
    apiVersion: 'v24.0',
    environment: options.environment || 'production',
    mode: options.mode,
    loginUri: options.loginUri,
    testLoginUri: options.testLoginUri
  });
  org.oauth = options.oauth;
  return org;
};

describe('Connection #refreshToken', function(){
  var org, oauth;

  beforeEach(function(done){
    oauth = {
      access_token: '1234567890',
      instance_url: 'http://instance.salesforce.com/',
      refresh_token: '1234567890'
    };
    org = createConnection({});
    done();
  });

  it('returns an error for missing oauth', function(done){
    org.refreshToken(null, function(err, res){
      should.exist(err);
      err.should.match(/invalid oauth/i);
      done();
    });
  });

  it('returns an error for missing instance url', function(done){
    delete oauth.instance_url;
    org.refreshToken(oauth, function(err, res){
      should.exist(err);
      err.should.match(/invalid oauth/i);
      done();
    });
  });

  it('returns an error for missing access token', function(done){
    delete oauth.access_token;
    org.refreshToken(oauth, function(err, res){
      should.exist(err);
      err.should.match(/invalid oauth/i);
      done();
    });
  });

  it('returns an error for missing refresh token', function(done){
    delete oauth.refresh_token;
    org.refreshToken(oauth, function(err, res){
      should.exist(err);
      err.should.match(/refresh token/i);
      done();
    });
  });

  describe('with a 200 response code', function(){

    it('parses the response body', function(done){
      setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.refreshToken(oauth, function(err, res){
        should.not.exist(err);
        res.responseKey.should.equal("responseValue");
        done();
      });
    });

    it('sets oauth to the body when mode is single', function(done){
      org = createConnection({mode: 'single', oauth: oauth});
      setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.refreshToken(oauth, function(err, res){
        org.oauth.responseKey.should.equal('responseValue');
        done();
      });
    });

    it('responds with error when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 200, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.should.match(/unparsable json/i);
        res.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 200, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.statusCode.should.equal(200);
        done();
      });
    });

  });

  describe('with a non-200 response code', function(){

    it('returns without body', function(done){
      setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.refreshToken(oauth, function(err, res){
        should.not.exist(res);
        done();
      });
    });

    it('parses the response body', function(done){
      setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.refreshToken(oauth, function(err, res){
        err.should.match(/errorValue/);
        done();
      });
    });

    it('sets a status code on the error', function(done){
      setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.refreshToken(oauth, function(err, res){
        err.statusCode.should.equal(400);
        done();
      });
    });

    it('responds with specific error when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 400, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.should.match(/unparsable json/i);
        res.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      setFakewebResponse({statusCode: 400, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.statusCode.should.equal(400);
        done();
      });
    });

  });

  it('returns the original error', function(done){
    org = createConnection({loginUri: 'bad uri'});
    setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
    org.refreshToken(oauth, function(err, res){
      should.exist(err);
      should.not.exist(res);
      done();
    });
  });

  it('uses the test uri when sandbox environment is specified', function(done){
    org = createConnection({testLoginUri: 'http://hello/', environment: 'sandbox'});
    setFakewebResponse({uri: 'http://hello:80/', statusCode: 200, body: '{"responseKey":"responseValue"}'});
    org.refreshToken(oauth, function(err, res){
      should.not.exist(err);
      res.responseKey.should.equal( "responseValue" );
      done();
    });
  });

});
