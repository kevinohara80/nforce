var should = require('should');
var helper = require('../test-helper');

describe('Connection #getIdentity', function(){
  var oauth, org;

  beforeEach(function(done){
    oauth = {
      access_token: '1234567890',
      instance_url: 'http://instance.salesforce.com/',
      refresh_token: '1234567890',
      id: 'http://example/'
    };
    org = helper.createConnection({});
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
    helper.setFakewebResponse({uri: 'http://example:80/', headers: {error: "example error"}, body: ''});
    org.getIdentity(oauth, function(err, body){
      err.should.match(/example error/i);
      should.not.exist(body);
      done();
    });
  });

  describe('when receiving a successful response', function(){

    it('parses the response body', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.getIdentity(oauth, function(err, body){
        should.not.exist(err);
        body.responseKey.should.equal('responseValue');
        done();
      });
    });

    it('responds with specific error when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', statusCode: 202, body: '<html></html>'});
      org.getIdentity(oauth, function(err, body){
        err.should.match(/unparsable json/i);
        body.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', statusCode: 204, body: '<html></html>'});
      org.getIdentity(oauth, function(err, body){
        err.statusCode.should.equal(204);
        done();
      });
    });

  });

  describe('when another status is received', function(){

    it('returns an error with a body', function(done){
      var errorBody = '[{"errorCode":503,"message":"proxy error"}]';
      helper.setFakewebResponse({uri: 'http://example:80/', statusCode: 500, body: errorBody});
      org.getIdentity(oauth, function(err, body){
        err.statusCode.should.equal(500);
        err.errorCode.should.equal(503);
        err.message.should.match(/proxy error/i);
        should.not.exist(body);
        done();
      });
    });

    it('responds with specific error when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', statusCode: 500, body: '<html></html>'});
      org.getIdentity(oauth, function(err, body){
        err.should.match(/unparsable json/i);
        body.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', statusCode: 500, body: '<html></html>'});
      org.getIdentity(oauth, function(err, body){
        err.statusCode.should.equal(500);
        done();
      });
    });

    it('returns an error if no body was received', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', statusCode: 500, body: ''});
      org.getIdentity(oauth, function(err, body){
        err.message.should.match(/500/);
        should.not.exist(body);
        done();
      });
    });

  });

});
