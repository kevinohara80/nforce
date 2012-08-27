var util   = require('util');
var events = require('events');

function FDCStream() {
  events.EventEmitter.call(this);
}

util.inherits(FDCStream, events.EventEmitter);

FDCStream.prototype.write = function(data) {
  this.emit('data', data);
}

module.exports = FDCStream;