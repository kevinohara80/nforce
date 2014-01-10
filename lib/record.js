var _ = require('lodash');

/*
var Record = function(d) {
  
  var data = d;
  var that = this;
  var _fieldValues = {};
  
  this.attributes = {}
  
  if(data.attributes) {
    this.attributes = data.attributes;
    delete data.attributes;
  }

  if(data.attachment) {
    this.attachment = data.attachment;
    delete data.attachment;
  }
  
  Object.keys(data).forEach(function(key) {
    (function (record, key, data) {
      record.__defineGetter__(key, function() {
        return data[key];
      });
      record.__defineSetter__(key, function(val) {
        data[key] = val;
        _fieldValues[key] = val;
      });
    }(that, key, data));
  });

  this.getFieldValues = function() {
    
    var fvs = {};

    for (var fvKey in _fieldValues) {
      if(fvKey.toLowerCase() !== 'id') fvs[fvKey] = _fieldValues[fvKey];
    }

    for (var fieldKey in that) {
      
      // get new properties that were added after instantiation
      if(fieldKey !== 'attributes'
        && fieldKey !== 'attachment'
        && fieldKey.toLowerCase() !== 'id' 
        && fieldKey.substring(0,1) !== '_' 
        && !that.__lookupGetter__(fieldKey) 
        && typeof that[fieldKey] !== 'function') {
          if(!fvs[fieldKey]) {
            fvs[fieldKey] = that[fieldKey];
          }
      }

      // create getters/setters for the new properties
      // and store the data
      if(!that.__lookupGetter__(fieldKey)) {
        (function(record, key, data) {
          data[key] = that[key];
          record.__defineGetter__(key, function() {
            return data[key];
          });
          record.__defineSetter__(key, function(val) {
            data[key] = val;
            _fieldValues[key] = val;
          });
        }(that, fieldKey, data));
      }

    }

    // clear the cache
    _fieldValues = {};

    return fvs;
  }

  this.setExternalId = function(field, value) {
    that.attributes.externalIdField = field;
    that.attributes.externalId = value;
  }

  this.getId = function() {
    if(that.Id) {
      return that.Id;
    } else if(that.id) {
      return that.id;
    } else if(that.ID) {
      return that.ID;
    } else if(that.attributes.url) {
      var url = that.attributes.url;
      return url.substr(url.lastIndexOf('/')+1);
    }
  }

}
*/

var Record = function(data) {
  
  var self = this;

  this.attributes = {};
  this._changed = [];
  this._previous = {};

  this._fields = _.transform(data, function(result, val, key) {
    key = key.toLowerCase();
    if(key !== 'attributes') {
      result[key.toLowerCase()] = val;
      self._changed.push(key);
    } else if(key === 'attributes') {
      self.attributes = val;
    } 
  });
  
}

Record.prototype.get = function(field) {
  field = field.toLowerCase();
  if(field && this._fields[field]) {
    return this._fields[field];
  }
}

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

}

Record.prototype.setId = function(id) {
  this._fields.id = id;
}

Record.prototype.getId = function() {
  return this._fields.id;
}

Record.prototype.setExternalId = function(field, value) {
  field = field.toLowerCase();
  this.attributes.externalIdField = field;
  this.attributes.externalId = value;
  this.set(field, value);
}

Record.prototype.getExternalId = function() {
  return this.attributes.externalId;
}

Record.prototype.getExternalIdField = function() {
  return this.attributes.externalIdField;
}

Record.prototype.getUrl = function() {
  return this.attributes.url;
}

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
}

Record.prototype.changed = function() {
  var self = this;
  var changed = {};
  _.forEach(this._changed, function(field) {
    changed[field] = self._fields[field];
  });
  return changed;
}

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
}

Record.prototype.toJSON = function() {

}

Record.prototype._reset = function() {
  this._changed = [];
  this._previous = {};
}

Record.prototype._getPayload = function(changedOnly) {
  changedOnly = (changedOnly === true);
}

module.exports = Record;