var _    = require('lodash');
var util = require('./util');

var Opts = function(args, validations, conn) {
  validations = validations || {};
  this._errors = [];
  this._args = Array.prototype.slice.apply(args);

  validations = _.defaults(validations, {
    oauth: false,
    sobject: false
  });

  if(_.isFunction(_.last(this._args))) {
    this.callback = _.last(this._args);
  } else {
    this.callback = function() {};
  }

  if(_.isObject(this._args[0])) {
    this.data = this._args[0];
  } else {
    this.data = {};
  }
  if(conn.mode === 'single' && !this.data.oauth) {
    this.data.oauth = conn.oauth;
  } 
  if(validations.oauth) {
    if(!this.data.oauth) {
      this.addError('missing oauth argument');
    } else {
      if(!util.validateOAuth(this.data.oauth)) {
        this.addError('invalid oauth argument');
      }
    }
  }
  if(validations.sobject) {
    if(!this.data.sobject) {
      this.addError('missing sobject argument');
    } else {
      if(!this.data.sobject.type || !_.isString(this.data.sobject.type)) {
        this.addError('invalid or missing type attribute on sobject')
      }
    }
  }
}

Opts.prototype.hasErrors = function() {
  if(this._errors && this._errors.length) {
    return true;
  }
  return false;
}

Opts.prototype.addError = function(err) {
  this._errors.push(err);
}

Opts.prototype.getError = function() {
  if(this._errors && this._errors.length) {
    return new Error('arg errors: '  + this._errors.join(', '));
  }
}

Opts.prototype.getOAuth = function() {
  return this.data.oauth || {};
}

module.exports = Opts;