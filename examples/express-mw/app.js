var nforce       = require('../../');
var sfuser       = process.env.SFUSER;
var sfpass       = process.env.SFPASS;
var express      = require('express');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var cookieParser = require('cookie-parser');

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

// Configuration

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: 'somesecret', key: 'sid' }));
app.use(org.expressOAuth({onSuccess: '/test/query', onError: '/oauth/error'}));

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'nforce test app'
  });
});

app.get('/oauth/authorize', function(req, res){
  res.redirect(org.getAuthUri());
});

app.get('/test/query', function(req, res) {
  var query = 'SELECT Id, Name, CreatedDate FROM Account ORDER BY CreatedDate DESC LIMIT 5';
  org.query({query: query, oauth: req.session.oauth}, function(err, resp) {
    if(!err) {
      res.render('query', {
        title: 'query results',
        records: resp.records
      });
    } else {
      res.send(err.message);
    }
  });
});

app.listen(3000);
console.log('express started');
