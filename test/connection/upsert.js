var nforce = require('../../');
var should = require('should');
var helper = require('../test-helper');

function createSampleSObject(options){
  options.type = options.hasOwnProperty('type') ? options.type : 'string';
  var sobject = nforce.createSObject(options.type, null);
  options.externalId = options.hasOwnProperty('externalId') ? options.externalId : 'exampleId';
  options.externalIdField = options.hasOwnProperty('externalIdField') ? options.externalIdField : 'exampleIdField';
  sobject.setExternalId(options.externalId, options.externalIdField);
  return sobject;
};

describe('Connection #upsert', function(){
  var org, oauth, sobject;
  var apiUri = 'http://example:80/services/data/v24.0/sobjects/string/exampleId/exampleIdField';

  beforeEach(function(done){
    org = helper.createConnection({});
    oauth = {instance_url: 'http://example', access_token: '1234567890'};
    sobject = createSampleSObject({});
    done();
  });

  describe('when validating SObjects', function(){

    it('returns error when data type is not a string', function(done){
      var sobject = createSampleSObject({type: null});
      org.upsert(sobject, null, function(err, data){
        err.should.match(/type.*string/i);
        should.not.exist(data);
        done();
      });
    });

    it('returns error when externalId is not defined', function(done){
      var sobject = createSampleSObject({externalId: null});
      org.upsert(sobject, null, function(err, data){
        err.should.match(/external id/i);
        should.not.exist(data);
        done();
      });
    });

    it('returns error when externalIdField is not defined', function(done){
      var sobject = createSampleSObject({externalIdField: null});
      org.upsert(sobject, null, function(err, data){
        err.should.match(/external id/i);
        should.not.exist(data);
        done();
      });
    });

  });

  describe('when validating oauth', function(){

    it('returns error when oauth is not present', function(done){
      org.upsert(sobject, null, function(err, data){
        err.should.match(/invalid oauth/i);
        should.not.exist(data);
        done();
      });
    });

    it('returns error when oauth has no instance url', function(done){
      org.upsert(sobject, {}, function(err, data){
        err.should.match(/invalid oauth/i);
        should.not.exist(data);
        done();
      });
    });

    it('returns error when oauth has no access token', function(done){
      delete oauth.access_token;
      org.upsert(sobject, oauth, function(err, data){
        err.should.match(/invalid oauth/i);
        should.not.exist(data);
        done();
      });
    });

    it('uses the connection oauth when mode is single', function(done){
      helper.setFakewebResponse({uri: 'http://example:80/', body: '{}'});
      org = helper.createConnection({mode: 'single'});
      org.upsert(sobject, oauth, function(err, data){
        err.should.match(/invalid oauth/i);
        done();
      });
    });

  });

  it('returns the original error if one was received', function(done){
    oauth.instance_url = 'bad uri';
    org.upsert(sobject, oauth, function(err, data){
      err.should.match(/invalid uri/i);
      should.not.exist(data);
      done();
    });
  });

  it('returns the error in the header of the response', function(done){
    helper.setFakewebResponse({uri: apiUri, headers: {error: "example error"}, body: ''});
    org.upsert(sobject, oauth, function(err, data){
      err.should.match(/example error/i);
      should.not.exist(data);
      done();
    });
  });

  describe('when receiving a successful response', function(){

    it('parses the response body', function(done){
      helper.setFakewebResponse({uri: apiUri, body: '{"responseKey":"responseValue"}'});
      org.upsert(sobject, oauth, function(err, data){
        should.not.exist(err);
        data.responseKey.should.equal("responseValue");
        done();
      });
    });

    it('updates the Id of the SObject with the id of the response body', function(done){
      helper.setFakewebResponse({uri: apiUri, body: '{"id":"9876543210"}'});
      org.upsert(sobject, oauth, function(err, data){
        should.not.exist(err);
        sobject.Id.should.equal('9876543210');
        done();
      });
    });

    it('does not update the Id of the SObject if there is no response body', function(done){
      helper.setFakewebResponse({uri: apiUri, body: ''});
      sobject.Id = '1234567890';
      org.upsert(sobject, oauth, function(err, data){
        should.not.exist(err);
        sobject.Id.should.equal('1234567890');
        done();
      });
    });

    it('does not update the Id of the SObject if Id is already set', function(done){
      helper.setFakewebResponse({uri: apiUri, body: '{"id":"9876543210"}'});
      sobject.Id = '1234567890';
      org.upsert(sobject, oauth, function(err, data){
        should.not.exist(err);
        sobject.Id.should.equal('1234567890');
        done();
      });
    });

    it('does not update the Id of the SObject if ID is already set', function(done){
      helper.setFakewebResponse({uri: apiUri, body: '{"id":"9876543210"}'});
      sobject.ID = '1234567890';
      org.upsert(sobject, oauth, function(err, data){
        should.not.exist(err);
        should.not.exist(sobject.Id);
        done();
      });
    });

    it('does not update the Id of the SObject if id is already set', function(done){
      helper.setFakewebResponse({uri: apiUri, body: '{"id":"9876543210"}'});
      sobject.id = '1234567890';
      org.upsert(sobject, oauth, function(err, data){
        should.not.exist(err);
        should.not.exist(sobject.Id);
        done();
      });
    });

    it('responds with specific error when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: apiUri, statusCode: 202, body: '<html></html>'});
      org.upsert(sobject, oauth, function(err, data){
        err.should.match(/unparsable json/i);
        data.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: apiUri, statusCode: 204, body: '<html></html>'});
      org.upsert(sobject, oauth, function(err, data){
        err.statusCode.should.equal(204);
        done();
      });
    });

  });

  describe('when another status is received', function(){

    it('returns an error with a body', function(done){
      var errorBody = '[{"errorCode":503,"message":"proxy error"}]';
      helper.setFakewebResponse({uri: apiUri, statusCode: 500, body: errorBody});
      org.upsert(sobject, oauth, function(err, data){
        err.statusCode.should.equal(500);
        err.errorCode.should.equal(503);
        err.message.should.match(/proxy error/i);
        should.not.exist(data);
        done();
      });
    });

    it('responds with specific error when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: apiUri, statusCode: 500, body: '<html></html>'});
      org.upsert(sobject, oauth, function(err, data){
        err.should.match(/unparsable json/i);
        data.should.equal('<html></html>');
        done();
      });
    });

    it('sets a status code when receiving unparsable JSON', function(done){
      helper.setFakewebResponse({uri: apiUri, statusCode: 500, body: '<html></html>'});
      org.upsert(sobject, oauth, function(err, data){
        err.statusCode.should.equal(500);
        done();
      });
    });

    it('returns an error if no body was received', function(done){
      helper.setFakewebResponse({uri: apiUri, statusCode: 500, body: ''});
      org.upsert(sobject, oauth, function(err, data){
        err.message.should.match(/500/);
        should.not.exist(data);
        done();
      });
    });

  });

});
