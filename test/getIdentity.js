var nforce = require('../');
var should = require('should');
var fakeweb = require('node-fakeweb');

function setFakewebResponse(options){
  fakeweb.allowNetConnect = false;
  fakeweb.registerUri({
    uri: options.uri || 'https://login.salesforce.com:443/services/oauth2/token',
    statusCode: options.statusCode,
    body: options.body,
    headers: options.headers
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

describe('Connection #getIdentity', function(){
  var oauth, org;

  beforeEach(function(done){
    oauth = {
      access_token: '1234567890',
      instance_url: 'http://instance.salesforce.com/',
      refresh_token: '1234567890',
      id: 'http://example/'
    };
    org = createConnection({});
    done();
  });

  describe('when validating oauth', function(){

    it('returns error when oauth is not present', function(done){
      org.getIdentity(null, function(err, body){
        err.should.match(/invalid oauth/i);
        done();
      });
    });

    it('returns error when oauth has no instance url', function(done){
      delete oauth.instance_url;
      org.getIdentity(oauth, function(err, body){
        err.should.match(/invalid oauth/i);
        done();
      });
    });

    it('returns error when oauth has no access token', function(done){
      delete oauth.access_token;
      org.getIdentity(oauth, function(err, body){
        err.should.match(/invalid oauth/i);
        done();
      });
    });

    it('returns error when oauth has no id', function(done){
      delete oauth.id;
      org.getIdentity(oauth, function(err, body){
        err.should.match(/uri.*required/i);
        done();
      });
    });

    it('uses the connection oauth when mode is single', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', body: '{}'});
      org = helper.createConnection({mode: 'single'});
      org.getIdentity(oauth, function(err, body){
        err.should.match(/invalid oauth/i);
        done();
      });
    });

  });

  it('returns the original error if one was received', function(done){
    oauth.id = 'bad uri';
    org.getIdentity(oauth, function(err, body){
      err.should.match(/invalid uri/i);
      should.not.exist(body);
      done();
    });
  });

  it('returns the error in the header of the response', function(done){
    setFakewebResponse({uri: 'http://example:80/', headers: {error: "example error"}, body: ''});
    org.getIdentity(oauth, function(err, body){
      err.should.match(/example error/i);
      should.not.exist(body);
      done();
    });
  });

  describe('when receiving a successful response', function(){

    it('parses the response body', function(done){
      setFakewebResponse({uri: 'http://example:80/', statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.getIdentity(oauth, function(err, body){
        should.not.exist(err);
        body.responseKey.should.equal('responseValue');
        done();
      });
    });

  });

  describe('when another status is received', function(){

    it('returns an error with a body', function(done){
      var errorBody = '[{"errorCode":503,"message":"proxy error"}]';
      setFakewebResponse({uri: 'http://example:80/', statusCode: 500, body: errorBody});
      org.getIdentity(oauth, function(err, body){
        err.statusCode.should.equal(500);
        err.errorCode.should.equal(503);
        err.message.should.match(/proxy error/i);
        should.not.exist(body);
        done();
      });
    });

    it('returns an error if no body was received', function(done){
      setFakewebResponse({uri: 'http://example:80/', statusCode: 500, body: ''});
      org.getIdentity(oauth, function(err, body){
        err.message.should.match(/500/);
        should.not.exist(body);
        done();
      });
    });

  });

});
