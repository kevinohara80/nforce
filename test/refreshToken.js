var should = require('should');
var helper = require('./test-helper');

describe('Connection #refreshToken', function(){
  var org, oauth;

  beforeEach(function(done){
    oauth = {
      access_token: '1234567890',
      instance_url: 'http://instance.salesforce.com/',
      refresh_token: '1234567890'
    };
    org = helper.createConnection({});
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
      helper.setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.refreshToken(oauth, function(err, res){
        should.not.exist(err);
        res.responseKey.should.equal("responseValue");
        done();
      });
    });

    it('sets oauth to the body when mode is single', function(done){
      org = helper.createConnection({mode: 'single', oauth: oauth});
      helper.setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
      org.refreshToken(oauth, function(err, res){
        org.oauth.responseKey.should.equal('responseValue');
        done();
      });
    });

    it('responds with error when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({statusCode: 200, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.should.match(/unparsable json/i);
        res.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({statusCode: 200, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.statusCode.should.equal(200);
        done();
      });
    });

  });

  describe('with a non-200 response code', function(){

    it('returns without body', function(done){
      helper.setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.refreshToken(oauth, function(err, res){
        should.not.exist(res);
        done();
      });
    });

    it('parses the response body', function(done){
      helper.setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.refreshToken(oauth, function(err, res){
        err.should.match(/errorValue/);
        done();
      });
    });

    it('sets a status code on the error', function(done){
      helper.setFakewebResponse({statusCode: 400, body: '{"error":"errorValue"}'});
      org.refreshToken(oauth, function(err, res){
        err.statusCode.should.equal(400);
        done();
      });
    });

    it('responds with specific error when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({statusCode: 400, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.should.match(/unparsable json/i);
        res.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({statusCode: 400, body: '<html></html>'});
      org.refreshToken(oauth, function(err, res){
        err.statusCode.should.equal(400);
        done();
      });
    });

  });

  it('returns the original error', function(done){
    org = helper.createConnection({loginUri: 'bad uri'});
    helper.setFakewebResponse({statusCode: 200, body: '{"responseKey":"responseValue"}'});
    org.refreshToken(oauth, function(err, res){
      should.exist(err);
      should.not.exist(res);
      done();
    });
  });

  it('uses the test uri when sandbox environment is specified', function(done){
    org = helper.createConnection({testLoginUri: 'http://hello/', environment: 'sandbox'});
    helper.setFakewebResponse({uri: 'http://hello:80/', statusCode: 200, body: '{"responseKey":"responseValue"}'});
    org.refreshToken(oauth, function(err, res){
      should.not.exist(err);
      res.responseKey.should.equal( "responseValue" );
      done();
    });
  });

});
