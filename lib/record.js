var Record = function(data) {
  
  this.attributes = {}
  
  if(data.attributes) {
    this.attributes = data.attributes;
    delete data.attributes;
  }
  
  var _fieldValues = {}
  
  var data = data;
  var key;
  
  for(key in data) {
    (function (record, key, data) {
      record.__defineGetter__(key, function() {
        return data[key];
      });
      record.__defineSetter__(key, function(val) {
        data[key] = val;
        _fieldValues[key] = val;
      });
    }(this, key, data));
  }

  var that = this;

  this.getFieldValues = function() {
    
    var fvs = {};

    for (var fvKey in _fieldValues) {
      if(fvKey.toLowerCase() !== 'id') fvs[fvKey] = _fieldValues[fvKey];
    }

    for (var fieldKey in that) {
      if(fieldKey !== 'attributes' && fieldKey !== 'Id' 
        && fieldKey !== 'id' && fieldKey !== 'ID'
        && fieldKey.substring(0,1) !== '_' && !that.__lookupGetter__(fieldKey) 
        && typeof that[fieldKey] !== 'function') {
          if(!fvs[fieldKey]) {
            fvs[fieldKey] = that[fieldKey];
          }
      }
    }
    return fvs;
  }

}

Record.prototype.setExternalId = function(field, value) {
  this.attributes.externalIdField = field;
  this.attributes.externalId = value;
}

Record.prototype.getId = function() {
  if(this.Id) {
    return this.Id;
  } else if(this.id) {
    return this.id;
  } else if(this.ID) {
    return this.ID;
  } else if(this.attributes.url) {
    var url = this.attributes.url;
    return url.substr(url.lastIndexOf('/')+1);
  }
}

module.exports = Record;