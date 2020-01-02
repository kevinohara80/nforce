import { expect } from 'chai';
import { URL } from 'url';

import Connection from '../src/classes/Connection';
import ConnectionOptions from '../src/contracts/ConnectOptions';
import GetAuthURIOptions from '../src/contracts/GetAuthURIOptions';

describe('src/classes/connection.ts', () => {
  describe('#getAuthUri', () => {
    it('should return an auth uri', () => {
      const opts: ConnectionOptions = {
        clientId: 'clientId123',
        clientSecret: 'clientSecret123',
        redirectUri: 'https://my.redirect.com/redirect'
      };

      const conn = new Connection(opts);

      const uri = conn.getAuthUri({});

      expect(uri.split('?')[0])
        .to.be.a('string')
        .that.equals('https://login.salesforce.com/services/oauth2/authorize');
    });

    it('should switch to test endpoints for sandbox environment', () => {
      const opts: ConnectionOptions = {
        clientId: 'clientId123',
        clientSecret: 'clientSecret123',
        redirectUri: 'https://my.redirect.com/redirect',
        environment: 'sandbox'
      };

      const conn = new Connection(opts);

      const uri = conn.getAuthUri({});

      expect(uri.split('?')[0])
        .to.be.a('string')
        .that.equals('https://test.salesforce.com/services/oauth2/authorize');
    });

    it('should trim whitespace from values', () => {
      const opts: ConnectionOptions = {
        clientId: 'clientId123',
        clientSecret: 'clientSecret123',
        redirectUri: 'https://my.redirect.com/redirect',
        environment: 'sandbox'
      };

      const conn = new Connection(opts);

      const uri = conn.getAuthUri(({
        display: '         none',
        prompt: 'consent ',
        loginHint: '   hint    ',
        scope: ['api ', ' chatter_api ']
      } as unknown) as GetAuthURIOptions);

      const parsed = new URL(uri);

      expect(parsed.searchParams.get('display')).to.equal('none');
      expect(parsed.searchParams.get('login_hint')).to.equal('hint');
      expect(parsed.searchParams.get('prompt')).to.equal('consent');
      expect(parsed.searchParams.get('scope')).to.equal('api chatter_api');
    });
  });
});
