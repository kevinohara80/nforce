function unparsableJSON(data, callback){
  var error = new Error('unparsable json');
  error.statusCode = data.statusCode;
  callback(error, data.body);
};

module.exports.unparsableJSON = unparsableJSON;
