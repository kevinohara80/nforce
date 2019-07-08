import { assert, expect } from 'chai';
import * as request from 'request-promise';
import * as sinon from 'sinon';

import Connection from '../src/classes/Connection';
import IConnectionOpts from '../src/contracts/IConnectionOpts';

const DEFAULT_CONNECTION_OPTS: IConnectionOpts = {
  clientId: 'testclientid',
  clientSecret: 'testclientsecret',
  redirectUri: 'https://my.redirect.uri',
};

let connection: Connection = new Connection(DEFAULT_CONNECTION_OPTS);
let getStub: sinon.SinonStub<any>;
let postStub: sinon.SinonStub<any>;

describe('src/classes/connection.ts', () => {
  describe('#authenticate', () => {
    beforeEach(() => {
      connection = new Connection(DEFAULT_CONNECTION_OPTS);
      getStub = sinon.stub(request, 'get');
      postStub = sinon.stub(request, 'post');
    });

    afterEach(() => {
      getStub.restore();
      postStub.restore();
    });

    it('should allow for username/password auth', async () => {
      postStub.resolves({
        headers: {
          'content-type': 'application/json',
        },
        statusCode: 200,
        body: {
          access_token: 'accesstoken1234',
        },
      });

      const resp = await connection.authenticate({
        username: 'myusername@test.com',
        password: 'somePassword',
        securityToken: 'abc2343',
      });

      expect(getStub).to.not.have.been.called;
      expect(postStub).to.have.been.called;
      expect(resp)
        .to.be.an('object')
        .with.property('access_token');
    });

    it('should cache OAuth data after successful auth', async () => {
      postStub.resolves({
        headers: {
          'content-type': 'application/json',
        },
        statusCode: 200,
        body: {
          access_token: 'accesstoken1234',
        },
      });

      const resp = await connection.authenticate({
        username: 'myusername@test.com',
        password: 'somePassword',
        securityToken: 'abc2343',
      });

      expect(postStub).to.have.been.calledOnce;
      expect(connection.getOAuth())
        .to.be.an('object')
        .with.property('access_token');
    });

    it('should throw APIAuthError for non-2xx status codes', async () => {
      postStub.resolves({
        headers: {
          'content-type': 'application/json',
        },
        statusCode: 401,
        body: {
          error: 'Unauthorized',
        },
      });

      try {
        await connection.authenticate({
          username: 'myusername@test.com',
          password: 'somePassword',
          securityToken: 'abc2343',
        });
        assert(false, 'expected authenticate to throw');
      } catch (err) {
        expect(postStub).to.have.been.calledOnce;
        expect(err.message).to.equal('Unauthorized');
        expect(err.error).to.equal('Unauthorized');
        expect(err.error_description).to.be.undefined;
        expect(err.name).to.equal('APIAuthError');
        expect(connection.getOAuth()).to.be.undefined;
      }
    });

    it('should parse response headers', async () => {
      postStub.resolves({
        headers: {
          'content-type': 'application/json',
          'sforce-limit-info': 'api-usage=1/100',
        },
        statusCode: 200,
        body: {
          access_token: 'accesstoken1234',
        },
      });

      const resp = await connection.authenticate({
        username: 'myusername@test.com',
        password: 'somePassword',
        securityToken: 'abc2343',
      });

      expect(postStub).to.have.been.calledOnce;
      expect(connection.getAPICalls()).to.equal(1);
      expect(connection.getAPICallsLimit()).to.equal(100);
    });
  });
});
