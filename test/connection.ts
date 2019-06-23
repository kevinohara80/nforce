import { expect } from 'chai';

import Connection from '../src/classes/Connection';

describe('src/classes/connection.ts', () => {
  describe('#constructor', () => {
    it('should be an class', () => {
      expect(Connection).to.be.a('function');
    });

    it('should create a connection with valid options', () => {
      const opts = {
        clientId: 'clientId123',
        clientSecret: 'clientSecret123',
        redirectUri: 'https://my.redirect.com/redirect',
      };

      const conn = new Connection(opts);

      expect(conn).to.be.an.instanceof(Connection);
    });

    it('should throw on missing clientId', () => {
      const opts = {
        clientSecret: 'clientSecret123',
        redirectUri: 'https://my.redirect.com/redirect',
      };

      try {
        // @ts-ignore
        const conn = new Connection(opts);
        throw new Error('expected constructor to throw');
      } catch (err) {
        expect(err.message).to.equal('invalid or missing clientId');
      }
    });

    it('should throw on missing clientSecret', () => {
      const opts = {
        clientId: 'clientId123',
        redirectUri: 'https://my.redirect.com/redirect',
      };

      try {
        // @ts-ignore
        const conn = new Connection(opts);
        throw new Error('expected constructor to throw');
      } catch (err) {
        expect(err.message).to.equal('invalid or missing clientSecret');
      }
    });

    it('should throw on missing redirectUri', () => {
      const opts = {
        clientId: 'clientId123',
        clientSecret: 'clientSecret123',
      };

      try {
        // @ts-ignore
        const conn = new Connection(opts);
        throw new Error('expected constructor to throw');
      } catch (err) {
        expect(err.message).to.equal('invalid or missing redirectUri');
      }
    });
  });
});
