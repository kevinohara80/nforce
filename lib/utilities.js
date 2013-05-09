function createJSONParser(self, callback){
  return function(err, res, body){
    if(err) { return callback(err, null); }

    var error = null, data = null;
    try {
      data = JSON.parse(body);
    } catch( e ){
      error = new Error('unparsable json');
      error.statusCode = res.statusCode;
      data = body;
    }

    if(!error){
      if(res.statusCode == 200) {
        if(self.mode === 'single') self.oauth = data;
        callback(null, data);
      } else {
        error = new Error(data.error + ' - ' + data.error_description);
        error.statusCode = res.statusCode;
        callback(error, null);
      }
    } else {
      callback(error, data);
    }
  };
};

module.exports.createJSONParser = createJSONParser;
