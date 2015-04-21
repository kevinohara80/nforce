var _ = require('lodash');

var Record = function(data) {

  var self = this;

  this.attributes = {};
  this._changed = [];
  this._previous = {};

  this._fields = _.transform(data, function(result, val, key) {
    key = key.toLowerCase();
    if(key !== 'attributes' && key !== 'attachment') {
      result[key.toLowerCase()] = val;
      self._changed.push(key);
    } else if(key === 'attributes') {
      self.attributes = val;
    } else if (key === 'attachment') {
      self._attachment = val;
    }
  });

};

Record.prototype.get = function(field) {
  field = field.toLowerCase();
  if(field && this._fields[field] !== undefined) {
    return this._fields[field];
  }
};

Record.prototype.set = function(field, value) {
  var self = this;
  var data = {};
  if(arguments.length === 2) {
    data[field.toLowerCase()] = value;
  } else {
    data = _.transform(field, function(result, val, key) {
      result[key.toLowerCase()] = val;
    });
  }

  Object.keys(data).forEach(function(key) {
    key = key.toLowerCase();
    if(key === 'attachment') {
      self._attachment = data[key];
      return;
    }
    if(!self._fields[key] || data[key] !== self._fields[key]) {
      if(_.indexOf(self._changed, key) === -1) {
        self._changed.push(key);
      }
      if(!self._previous[key]) {
        self._previous[key] = self._fields[key];
      }
      self._fields[key] = data[key];
    }
  });

};

Record.prototype.getId = function() {
  return this._fields.id;
};

Record.prototype.setId = function(id) {
  this._fields.id = id;
};

Record.prototype.getType = function() {
  return (this.attributes.type) ? this.attributes.type.toLowerCase() : undefined;
};

Record.prototype.getUrl = function() {
  return this.attributes.url;
};

Record.prototype.isType = function(type) {
  if(!_.isString(type)) return false;
  type = type.toLowerCase();
  return (type === this.getType());
};

Record.prototype.getExternalId = function() {
  return this.attributes.externalId;
};

Record.prototype.getExternalIdField = function() {
  return this.attributes.externalIdField;
};

Record.prototype.setExternalId = function(field, value) {
  field = field.toLowerCase();
  this.attributes.externalIdField = field;
  this.attributes.externalId = value;
  this.set(field, value);
};

Record.prototype.getAttachment = function() {
  return this._attachment || {};
};

Record.prototype.setAttachment = function(fileName, body) {
  this._attachment = { fileName: fileName, body: body };
};

Record.prototype.getFileName = function() {
  return (this._attachment) ? this._attachment.fileName : undefined;
};

Record.prototype.setFileName = function(fileName) {
  this._attachment = this._attachment || {};
  this._attachment.fileName = fileName;
};

Record.prototype.getBody = function() {
  return (this._attachment) ? this._attachment.body : undefined;
};

Record.prototype.setBody = function(body) {
  this._attachment = this._attachment || {};
  this._attachment.body = body;
};

Record.prototype.hasChanged = function(field) {
  if(!this._changed || this._changed.length === 0) {
    return false;
  } else if(!field) {
    return true;
  } else {
    if(_.indexOf(this._changed, field.toLowerCase()) !== -1) {
      return true;
    }
  }
  return false;
};

Record.prototype.changed = function() {
  var self = this;
  var changed = {};
  _.forEach(this._changed, function(field) {
    changed[field] = self._fields[field];
  });
  return changed;
};

Record.prototype.previous = function(field) {
  if(field) field = field.toLowerCase();
  if(_.isString(field)) {
    if(this._previous[field]) {
      return this._previous[field];
    } else {
      return;
    }
  } else {
    return this._previous || {};
  }
};

Record.prototype.toJSON = function() {
  var data = this._getPayload(false);
  if(!data.id && this.getId()) {
    data.id = this.getId();
  }
  return data;
};

Record.prototype._reset = function() {
  this._changed = [];
  this._previous = {};
};

Record.prototype._getPayload = function(changedOnly) {
  var self = this;
  changedOnly = (changedOnly === true);

  var data = _.transform(this._fields, function(result, value, key) {
    if(changedOnly && _.indexOf(self._changed, key) === -1) return;
    key = key.toLowerCase();
    if(key !== 'id' && key !== self.getExternalIdField()) {
      result[key] = value;
    }
  });

  return data;
};

module.exports = Record;
