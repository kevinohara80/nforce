var nforce = require('../');
var Opts   = require('../lib/opts');
var should = require('should');

function getMultiConnection() {
  return nforce.createConnection({
    clientId: 'SOME_OAUTH_CLIENT_ID',
    clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
    redirectUri: 'http://localhost:3000/oauth/_callback',
    apiVersion: 'v24.0',  
    environment: 'production',
    mode: 'multi'
  });
}

function getSingleConnection() {
  return nforce.createConnection({
    clientId: 'SOME_OAUTH_CLIENT_ID',
    clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
    redirectUri: 'http://localhost:3000/oauth/_callback',
    apiVersion: 'v24.0',  
    environment: 'production',
    mode: 'single'
  });
}

function getValidOAuth() {
  return {
    instance_url: 'https://my.endpoints.com',
    access_token: 'falsdjflasdkfjalskfjas'
  }
}

describe('lib/opts', function() {


  describe('#constructor', function() {

    it('should return data and a callback', function() {
      function getOpts() {
        return new Opts(arguments, {}, getSingleConnection());
      }
      var opts = getOpts({ something: 'test' });
      opts.data.should.be.an.Object;
      opts.callback.should.be.a.Function;
      opts = getOpts();
      opts.data.should.be.an.Object;
      opts.callback.should.be.a.Function;
    });

    it('should return the callback set as the only argument', function() {
      function getOpts() {
        return new Opts(arguments, {}, getSingleConnection());
      }
      var opts = getOpts(function() {
        return 'it works';
      });
      opts.callback.should.be.a.Function;
      opts.callback().should.equal('it works');
    });

    it('should return the callback when set as the second argument', function() {
      function getOpts() {
        return new Opts(arguments, {}, getSingleConnection());
      }
      var opts = getOpts({something: 'blah'}, function() {
        return 'it works';
      });
      opts.callback.should.be.a.Function;
      opts.callback().should.equal('it works');
    });

    it('should get oauth from the conn when single user mode', function() {
      function getOpts() {
        var conn = getSingleConnection();
        conn.oauth = getValidOAuth();
        return new Opts(arguments, {}, conn);
      }
      var opts = getOpts({ single: 'mode' }, function() {});
      opts.data.oauth.should.be.an.Object;
      opts.data.oauth.instance_url.should.equal(getValidOAuth().instance_url);
    });

    it('should get oauth from the data when multi user mode', function() {
      function getOpts() {
        return new Opts(arguments, {}, getMultiConnection());
      }
      var opts = getOpts({ single: 'mode', oauth: getValidOAuth() }, function() {});
      opts.data.oauth.should.be.an.Object;
      opts.data.oauth.instance_url.should.equal(getValidOAuth().instance_url);
    });

  });

  describe('#hasErrors', function() {

    it('should return false when there are no validation errors', function() {
      function getOpts() {
        return new Opts(arguments, {}, getSingleConnection());
      }
      var opts = getOpts();
      opts.hasErrors().should.be.false;
    });

    it('should return true when no oauth', function() {
      function getOpts() {
        return new Opts(arguments, { oauth: true }, getSingleConnection());
      }
      var opts = getOpts();
      opts.hasErrors().should.be.true;
      opts._errors.length.should.equal(1);
    });

    it('should return true when invalid oauth', function() {
      function getOpts() {
        var conn = getSingleConnection();
        conn.oauth = { sdofs: 'sdfsafas' };
        return new Opts(arguments, { oauth: true }, conn);
      }
      var opts = getOpts();
      opts.hasErrors().should.be.true;
      opts._errors.length.should.equal(1);
    });

  });

  describe('#getError', function() {

    it('should return a single error object', function() {
      function getOpts() {
        var conn = getSingleConnection();
        conn.oauth = { sdofs: 'sdfsafas' };
        return new Opts(arguments, { oauth: true }, conn);
      }
      var opts = getOpts();
      should.exist(opts.getError());
      opts.getError().should.be.an.Object;
    });

  });

  describe('#getOAuth', function() {

    it('should return the oauth object', function() {
      function getOpts() {
        var conn = getSingleConnection();
        conn.oauth = getValidOAuth();
        return new Opts(arguments, {}, conn);
      }
      var opts = getOpts({ single: 'mode' }, function() {});
      opts.getOAuth().should.be.an.Object;
    });

  });

});