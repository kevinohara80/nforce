// example nforce plugin

module.exports = function(nforce) {

  nforce.extend('foo', function() {
    return 'bar'
  });

  // with a callback
  nforce.extend('getApiVersion', function(cb) {
    if(!this.apiVersion) {
      return cb(new Error('No API version specified'));
    } else {
      cb(null, 'The current ApiVersion is ' + this.apiVersion);
    }
  });

  // using exposed util functions from nforce
  nforce.extend('doValidateOAuth', function(oauth) {
    return nforce.util.validateOAuth(oauth);
  });

}