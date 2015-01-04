var nforce = require('../');
var should = require('should');
var api    = require('./mock/sfdc-rest-api');
var port   = process.env.PORT || 3000;

var orgMulti  = nforce.createConnection(api.getClient());
var orgSingle = nforce.createConnection(api.getClient({ mode: 'single' }));

var testQuery = 'SELECT Id FROM Account LIMIT 1';
var oauth     = api.getOAuth();

orgSingle.setOAuth(oauth);

function verifyAccessToken() {
  api.getLastRequest().headers
    .should.have.property('authorization', 'Bearer ' + oauth.access_token);
}

describe('query', function(){

  // set up mock server
  before(function(done) {
    api.start(port, done);
  });

  describe('#query', function(){

    var expected = '/services/data/v27.0/query?q=SELECT%20Id%20FROM%20Account%20LIMIT%201';

    it('should work in multi-user mode', function(done){
      orgMulti.query({ query: testQuery, oauth: oauth }, function(err, res) {
        api.getLastRequest().url.should.equal(expected);
        done();
      });
    });

    it('should work in multi-user mode with promises', function(done){
      orgMulti.query({ query: testQuery, oauth: oauth }).then(function(res) {
        api.getLastRequest().url.should.equal(expected);
        api.getLastRequest().headers.should.have.property('authorization', 'Bearer ' + oauth.access_token);
        done();
      }).error(function(err){
        should.not.exist(err);
        done();
      });
    });

    it('should work in single-user mode', function(done){
      orgSingle.query({ query: testQuery }, function(err, res) {
        api.getLastRequest().url.should.equal(expected);
        done();
      });
    });

    it('should work in single-user mode with promises', function(done){
      orgSingle.query({ query: testQuery }).then(function(res) {
        api.getLastRequest().url.should.equal(expected);
        done();
      }).error(function(err){
        should.not.exist(err);
        done();
      });
    });

    it('should allow a string query in single-user mode', function(done) {
      orgSingle.query(testQuery, function(err, res) {
        api.getLastRequest().url.should.equal(expected);
        done();
      });
    });

  });

  describe('#queryAll', function(){

    var expected = '/services/data/v27.0/queryAll?q=SELECT%20Id%20FROM%20Account%20LIMIT%201';

    it('should work in multi-user mode', function(done){
      orgMulti.queryAll({ query: testQuery, oauth: oauth }, function(err, res) {
        api.getLastRequest().url.should.equal(expected);
        verifyAccessToken();
        done();
      });
    });

    it('should work in multi-user mode with promises', function(done){
      orgMulti.queryAll({ query: testQuery, oauth: oauth }).then(function(res) {
        api.getLastRequest().url.should.equal(expected);
        verifyAccessToken();
        done();
      }).error(function(err){
        should.not.exist(err);
        done();
      });
    });

    it('should work in single-user mode', function(done){
      orgSingle.queryAll({ query: testQuery }, function(err, res) {
        api.getLastRequest().url.should.equal(expected);
        verifyAccessToken();
        done();
      });
    });

    it('should work in single-user mode with promises', function(done){
      orgSingle.queryAll({ query: testQuery }).then(function(res) {
        api.getLastRequest().url.should.equal(expected);
        verifyAccessToken();
        done();
      }).error(function(err){
        should.not.exist(err);
        done();
      });
    });

    it('should allow a string query in single-user mode', function(done) {
      orgSingle.queryAll(testQuery, function(err, res) {
        api.getLastRequest().url.should.equal(expected);
        verifyAccessToken();
        done();
      });
    });

  });

  // reset the lastRequest
  afterEach(function() {
    api.reset();
  });

  // close mock server
  after(function(done) {
    api.stop(done);
  });

});
