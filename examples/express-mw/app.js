var express = require('express');
var nforce = require('nforce');
var app = module.exports = express.createServer();

var org = nforce.createConnection({
  clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
  clientSecret: '9154137956044345875',
  redirectUri: 'http://localhost:3000/oauth/_callback'
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'nforce testing baby' }));
  app.use(org.expressOAuth({onSuccess: '/test/query', onError: '/oauth/error'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

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
  org.query(query, req.session.oauth, function(err, resp) {
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
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
