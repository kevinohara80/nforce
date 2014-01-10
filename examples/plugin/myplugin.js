// example nforce plugin
 
module.exports = function(nforce) {
 
  // throws if the plugin already exists
  var plugin = nforce.plugin('myplugin');
  
  // simple example
  // org.myplugin.foo() => true|false
  plugin.fn('foo', function() {
    return 'bar'
  });
  
  // using a callback
  // org.myplugin.getApiVersion(cb)
  plugin.fn('getApiVersion', function(cb) {
    if(!this.apiVersion) {
      return cb(new Error('No API version specified'));
    } else {
      cb(null, 'The current ApiVersion is ' + this.apiVersion);
    }
  });
 
  // using exposed util functions
  // org.myplugin.doValidateOAuth(oauth) => true|false
  plugin.fn('doValidateOAuth', function(oauth) {
    return plugin.util.validateOAuth(oauth);
  });
 
}