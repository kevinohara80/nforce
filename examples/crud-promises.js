var nforce = require('../');
var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;

var oauth;

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback',
  mode: 'single'
});

var ld;

console.log('authenticating');

org.authenticate({ username: sfuser, password: sfpass }).then(function(oauth){
  console.log('authenticated');
  console.log('inserting new lead');
  ld = nforce.createSObject('Lead', {
    FirstName: 'Bobby',
    LastName: 'Tester',
    Company: 'ABC Widgets',
    Email: 'bobbytester@testertest.com'
  });
  return org.insert({ sobject: ld });

}).then(function(){

  console.log('new lead inserted');
  console.log('updating lead');
  ld.set('FirstName', 'Harold');
  return org.update({ sobject: ld });

}).then(function(){

  console.log('deleting lead');
  return org.delete({ sobject: ld });

}).error(function(err) {

  console.error('crud failed');
  console.error(err);

}).finally(function() {

  console.log('exiting');

});
