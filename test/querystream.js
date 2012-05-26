var should = require('should');
var QueryStream = require('../lib/querystream');

describe('lib/querystream', function(){ 
  
  describe('#constructor', function() {
  
    it('should create a QueryStream instance object', function() {
      var qs = new QueryStream();
    });
    
    it('should have a write method', function() {
      var qs = new QueryStream();
      should.exist(qs.write);
    });
    
    it('should have a pipe method', function() {
      var qs = new QueryStream();
      should.exist(qs.pipe);
    });
    
    it('should have an end method', function() {
      var qs = new QueryStream();
      should.exist(qs.end);
    });
    
    it('should be readable', function() {
      var qs = new QueryStream();
      should.exist(qs.readable);
      qs.readable.should.be.true;
    });
    
    it('should be writable', function() {
      var qs = new QueryStream();
      should.exist(qs.writable);
      qs.writable.should.be.true;
    });

  });

  describe('#write', function() {
    
    it('should emit data event on write', function(done) {
      var qs = new QueryStream();
      qs.on('data', function(data) {
        done();
      });
      qs.write('blah');
    });
    
  });
  
  describe('#end', function() {
    
    it('should emit end event on end', function(done) {
      var qs = new QueryStream();
      qs.on('end', function(data) {
        done();
      });
      qs.end('blah');
    });
    
  });
  
  describe('#isStreaming', function() {
    
    it('should return true with listeners', function() {
      var qs = new QueryStream();
      qs.on('data', function(data) { });
      qs.isStreaming().should.be.true;

    });
    
    it('should return false with listeners', function() {
      var qs = new QueryStream();
      qs.isStreaming().should.be.false;
    });
    
  });
  
  
});
  
