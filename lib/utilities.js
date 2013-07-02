var errors = require('./errors');

function createJSONParser(self, callback){
  return function(err, res, body){
    if(err) { return callback(err, null); }

    var error = null, data = null;
    try {
      data = JSON.parse(body);
    } catch( e ){
      return errors.unparsableJSON({statusCode: res.statusCode, body: body}, callback);
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
