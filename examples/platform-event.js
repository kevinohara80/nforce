var nforce = require('../');

var org = nforce.createConnection({
  clientId: '3MVG9SemV5D80oBea2IeBN0xcz_C0GLWbts0E6VRV293FNa4eILStgASMWudupPnTZvB7tCHSsEZL5RV_FcDo',
  clientSecret: '5422396158889181410',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  environment: 'production'
});


org.authenticate({ username: process.env.SFUSER, password: process.env.SFPASS}, function(err, oauth){

  if(err) return console.log(err);

  console.log('connecting to event');
  var str = org.stream({ topic: 'Test_event__e', oauth: oauth, isEvent:true, apiVersion: 'v39.0' });

  str.on('connect', function(){
    console.log('connected to event source');
  });

  str.on('error', function(error) {
    console.log('error: ' + error);
  });

  str.on('data', function(data) {
    console.log(data);
    str.cancel();
    str.client.disconnect();
  });

});
