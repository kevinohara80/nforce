import { expect } from 'chai';

import Connection from '../src/classes/Connection';
import IConnectionOpts from '../src/contracts/IConnectionOpts';

describe('src/classes/connection.ts', () => {
  describe('#getAuthUri', () => {

    it('should return an auth uri', () => {
      const opts: IConnectionOpts = {
        clientId: 'clientId123',
        clientSecret: 'clientSecret123',
        redirectUri: 'https://my.redirect.com/redirect',
      };

      const conn = new Connection(opts);

      const uri = conn.getAuthUri({});

      expect(uri.split('?')[0])
        .to.be.a('string')
        .that.equals('https://login.salesforce.com/services/oauth2/authorize');
    });

    it('should switch to test endpoints for sandbox environment', () => {
      const opts: IConnectionOpts = {
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

  });

});
