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

var Record = function(type, fields) {
  fields = fields || {};
  
  this.attributes = {};
  this.attributes.type = type;
  this._fields = fields;
  this._changed = _.keys(fields);
}

Record.prototype.get = function(field) {

}

Record.prototype.getId = function() {

}

Record.prototype.getUrl = function() {
  return this.attributes.url;
}

Record.prototype.set = function(field, value) {
  var data = {};
  if(arguments.length === 1) {
    data[field] = value;
  } else {
    data = value;
  }

  if(_.indexOf(this._changed, field) !== -1) {
    
  }

}

Record.prototype.setExternalId = function(field, value) {
  this.attributes.externalIdField = field;
  this.attributes.externalId = value;
}

Record.prototype.toJSON = function() {

}

module.exports = Record;