var http        = require('http');
var port        = process.env.PORT || 3000;
var lastRequest = null;
var nextResponse = null;

var server;

module.exports.setPort = function(p) {
  port = p;
}

module.exports.start = function(port, cb) {

  if(!port) port = process.env.PORT || 3000;

  server = http.createServer(function(req, res) {
      
    lastRequest = req;
    lastRequest.body = '';

    req.on('data', function(chunk) {
      lastRequest.body += chunk.toString();
    });

    req.on('end', function() {
      if(nextResponse) {
        res.writeHead(nextResponse.code, nextResponse.headers);
        if(nextResponse.body) {
          res.write(nextResponse.body, 'utf8')
        }
      } else {
        res.writeHead(200, { 
          'Content-Type': 'application/json'
        });
      } 
      res.end();
    });
 
  });

  server.listen(port, cb);

}

// return an example client
module.exports.getClient = function() {
  return {
    clientId: 'ADFJSD234ADF765SFG55FD54S',
    clientSecret: 'adsfkdsalfajdskfa',
    redirectUri: 'http://localhost:' + port + '/oauth/_callback',
    loginUri: 'http://localhost:' + port + '/login/uri'
  }
}

// return an example oauth
module.exports.getOAuth = function() {
  return {
    id: 'http://localhost: ' + port + '/id/00Dd0000000fOlWEAU/005d00000014XTPAA2',
    issued_at: '1362448234803',
    instance_url: 'http://localhost:' + port,
    signature: 'djaflkdjfdalkjfdalksjfalkfjlsdj',
    access_token: 'aflkdsjfdlashfadhfladskfjlajfalskjfldsakjf'
  }
}

module.exports.setResponse = function(code, headers, body) {
  nextResponse = {
    code: code,
    headers: headers,
    body: body
  }
}

// return the last cached request
module.exports.getLastRequest = function() {
  return lastRequest;
}

// reset the cache
module.exports.reset = function() {
  lastRequest = null;
  nextResponse = null;
}

// close the server
module.exports.stop = function(cb) {
  server.close(cb);
  server = null;
}