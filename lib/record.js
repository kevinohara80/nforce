var Record = function(data) {
  
  if(data.attributes) {
    this.attributes = data.attributes;
    delete data.attributes;
  }
  
  this.fieldValues = {}
  this._data = data;
  
  var key;
  
  for(key in data) {
    (function (record, key) {
      record.__defineGetter__(key, function() {
        return record._data[key];
      });
      record.__defineSetter__(key, function(val) {
        record._data[key] = val;
        record.fieldValues[key] = val;
      });
    }(this, key));
  }
}

Record.prototype.getFieldValues = function() {
  var fvs = this.fieldValues;
  for (var fieldKey in this) {
    if(fieldKey !== 'url' && fieldKey !== 'type' && fieldKey !== 'id' 
      && fieldKey.substring(0,1) !== '_' && fieldKey !== 'fieldValues'
      && !this.__lookupGetter__(fieldKey) && typeof this[fieldKey] !== 'function') {
      if(!fvs[fieldKey]) {
        fvs[fieldKey] = this[fieldKey];
      }
    }
  }
  return fvs;
}


module.exports = Record;