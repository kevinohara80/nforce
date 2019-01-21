var util = require('util');
var events = require('events');
var faye = require('faye');

var DEFAULT_REPLAY_ID = -1 // defaults to -1...new events only

/**
  * Resolves the appropriate replayId for the topic. Calling
  * this function with null or undefined returns the default
  * replay Id
  * 
  * @param {string} replayId The replay Id to check
  * @returns {string} Returns either the replay Id that the
  * function was called with or the default replay Id if the function
  * was called with null or undefined
  */
function getReplayId(replayId) {
  if (replayId === null || typeof replayId === 'undefined') {
    return DEFAULT_REPLAY_ID;
  }
  return replayId;
}

/**
  * Creates a new Streaming subscription from a streaming
  * client
  * 
  * @class
  * @param {Object} opts Subscription options
  * @param {string} opts.topic The topic for the subscription
  * @param {string|number} [opts.replayId] The replay Id for the subscription
  * @param {Client} client An instance of a streaming client
  */
function Subscription(opts, client) {
  var self = this;
  this.client = client;
  opts = opts || {};

  events.EventEmitter.call(this);

  this._topic = opts.topic.trim().toLowerCase();
  
  if (client._replayMap[this._topic] && typeof opts.replayId !== 'undefined' && opts.replayId !== null) {
    this._replayId = opts.replayId;
  } else {
    this._replayId = getReplayId(opts.replayId);
  }

  this._replayId = getReplayId(opts.replayId);

  client.setReplayId(this._topic, this._replayId);

  this._sub = client._fayeClient.subscribe(this._topic, function(d) {
    self.emit('data', d);
  });

  this._sub.callback(function(){
    self.emit('connect');
  });

  this._sub.errback(function(err) {
    self.emit('error', err);
  });
}

util.inherits(Subscription, events.EventEmitter);

Subscription.prototype.cancel = function() {
  if(this._sub) this._sub.cancel();
};

Subscription.prototype.getTopic = function () {
  return this._topic;
}

Subscription.prototype.getReplayId = function () {
  return this.client.getReplayId(this.getTopic());
}

// Client definition

/**
  * Creates a new streaming client instance
  * 
  * @class
  * @param {Object} opts Streaming client options
  * @param {number} [opts.retry] Retry interval to use for reconnects
  * @param {number} [opts.timeout] The retry timeout to use for the connection
  * @param {Object} opts.oauth OAuth connection object
  * @param {string} opts.oauth.apiVersion String version of the Salesforce API version
  * to use
  */
function Client(opts) {
  var self = this;
  opts = opts || {};

  events.EventEmitter.call(this);

  this._endpoint = opts.oauth.instance_url + '/cometd/' + opts.apiVersion.substring(1);

  this._fayeClient = new faye.Client(this._endpoint, {
    timeout: opts.timeout,
    retry: opts.retry
  });

  this.setOAuthToken(opts.oauth.access_token);

  this._fayeClient.on('transport:up', function () {
    self.emit('connect');
  });

  this._fayeClient.on('transport:down', function () {
    self.emit('disconnect', { reason: 'transport down' });
  });

  this._replayMap = {};

  var debugExtension = {
    incoming: function (message, callback) {
      var debugMessage = {
        direction: 'incoming',
        message: message
      }
      self.emit('debug', debugMessage);
      self.emit('debug:incoming', debugMessage);
      callback(message);
    },
    outgoing: function (message, callback) {
      var debugMessage = {
        direction: 'outgoing',
        message: message
      }
      self.emit('debug', debugMessage);
      self.emit('debug:outgoing', debugMessage);
      callback(message);
    }
  }

  var disconnectExtension = {
    incoming: function (message, callback) {
      if (message.channel === '/meta/disconnect') {
        self.emit('disconnect', {
          reason: 'server disconnect',
          data: message
        })
      }
      callback(message);
    }
  }

  var replayExtension = {
    incoming: function (message, callback) {
      if (message.data && message.data.event && typeof message.data.event.replayId !== 'undefined') {
        if (self._replayMap[message.channel]) {
          self.setReplayId(message.channel, message.data.event.replayId)
        }
      }
      callback(message);
    },
    outgoing: function (message, callback) {
      if (message.channel === '/meta/subscribe') {
        if (!message.ext) { message.ext = {}; }
        message.ext['replay'] = self._replayMap;
      }
      callback(message);
    }
  };

  this._fayeClient.addExtension(debugExtension);
  this._fayeClient.addExtension(disconnectExtension);
  this._fayeClient.addExtension(replayExtension);
}

util.inherits(Client, events.EventEmitter);
/**
  * 
  * 
  * @param {*} opts
  * @returns
  */
Client.prototype.subscribe = function(opts) {
  opts = opts || {};
  return new Subscription(opts, this);
};

Client.prototype.connect = function () {
  this._fayeClient.connect();
}

Client.prototype.disconnect = function(opts) {
  this._fayeClient.disconnect();
};

Client.prototype.setReplayId = function(topic, replayId) {
  this._replayMap[topic.trim().toLowerCase()] = getReplayId(replayId);
};

Client.prototype.setOAuthToken = function (token) {
  this._fayeClient.setHeader('Authorization', 'Bearer ' + token);
}

Client.prototype.getReplayId = function (topic) {
  if (this._replayMap[topic.trim().toLowerCase()]) {
    return this._replayMap[topic.trim().toLowerCase()];
  }
}

Client.prototype.getReplayMap = function () {
  return this._replayMap;
}

module.exports.Subscription = Subscription;
module.exports.Client       = Client;