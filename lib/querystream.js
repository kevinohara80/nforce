var Stream = require('stream').Stream;
var util   = require('util');

var QueryStream = function() {
  Stream.call(this);
  this.readable = true;
  this.writable = true;
};

util.inherits(QueryStream, Stream);

QueryStream.prototype.write = function(string) {
  if (this.listeners('data').length) {
    this.emit('data', string);
  }
};

QueryStream.prototype.end = function(string) {
  this.emit('end', string);
} 

QueryStream.prototype.error = function(err) {
  this.emit('error', err);
}

QueryStream.prototype.isStreaming = function() {
  if(this.listeners('data').length) {
    return true;
  } else {
    return false;
  }
}

module.exports = QueryStream;

