import { assert, expect } from 'chai';
import * as sinon from 'sinon';
import axios, { AxiosRequestConfig } from 'axios';

import Connection from '../src/classes/Connection';
import IConnectionOpts from '../src/contracts/ConnectOptions';

const DEFAULT_CONNECTION_OPTS: IConnectionOpts = {
  clientId: 'testclientid',
  clientSecret: 'testclientsecret',
  redirectUri: 'https://my.redirect.uri'
};

let connection: Connection = new Connection(DEFAULT_CONNECTION_OPTS);
let requestStub: sinon.SinonStub<[AxiosRequestConfig], Promise<unknown>>;

describe('src/classes/connection.ts', () => {
  describe('#authenticate', () => {
    beforeEach(() => {
      connection = new Connection(DEFAULT_CONNECTION_OPTS);
      requestStub = sinon.stub(axios, 'request');
    });

    afterEach(() => {
      requestStub.restore();
    });

    it('should allow for username/password auth', async () => {
      requestStub.resolves({
        headers: {
          'content-type': 'application/json'
        },
        status: 200,
        data: {
          access_token: 'accesstoken1234'
        }
      });

      const resp = await connection.authenticate({
        username: 'myusername@test.com',
        password: 'somePassword',
        securityToken: 'abc2343'
      });

      expect(requestStub).to.have.been.called;
      expect(resp)
        .to.be.an('object')
        .with.property('access_token');
    });

    it('should cache OAuth data after successful auth', async () => {
      requestStub.resolves({
        headers: {
          'content-type': 'application/json'
        },
        status: 200,
        data: {
          access_token: 'accesstoken1234'
        }
      });

      await connection.authenticate({
        username: 'myusername@test.com',
        password: 'somePassword',
        securityToken: 'abc2343'
      });

      expect(requestStub).to.have.been.calledOnce;
      expect(connection.getOAuth())
        .to.be.an('object')
        .with.property('access_token');
    });

    it('should throw APIAuthError for non-2xx status codes', async () => {
      requestStub.rejects({
        response: {
          headers: {
            'content-type': 'application/json'
          },
          status: 401,
          data: {
            error: 'Unauthorized'
          }
        }
      });

      try {
        await connection.authenticate({
          username: 'myusername@test.com',
          password: 'somePassword',
          securityToken: 'abc2343'
        });
        assert(false, 'expected authenticate to throw');
      } catch (err) {
        expect(requestStub).to.have.been.calledOnce;
        expect(err.message).to.equal('Unauthorized');
        expect(err.error).to.equal('Unauthorized');
        expect(err.error_description).to.be.undefined;
        expect(err.name).to.equal('APIAuthError');
        expect(connection.getOAuth()).to.be.undefined;
      }
    });

    it('should parse response headers', async () => {
      requestStub.resolves({
        headers: {
          'content-type': 'application/json',
          'sforce-limit-info': 'api-usage=1/100'
        },
        status: 200,
        body: {
          access_token: 'accesstoken1234'
        }
      });

      await connection.authenticate({
        username: 'myusername@test.com',
        password: 'somePassword',
        securityToken: 'abc2343'
      });

      expect(requestStub).to.have.been.calledOnce;
      expect(connection.getAPICalls()).to.equal(1);
      expect(connection.getAPICallsLimit()).to.equal(100);
    });
  });
});
