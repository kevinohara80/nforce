import { expect } from 'chai';
import * as request from 'request-promise';
import * as sinon from 'sinon';

import Connection from '../src/classes/Connection';
import IConnectionOpts from '../src/contracts/IConnectionOpts';

const DEFAULT_CONNECTION_OPTS: IConnectionOpts = {
  clientId: 'testclientid',
  clientSecret: 'testclientsecret',
  redirectUri: 'https://my.redirect.uri'
}

let connection: Connection = new Connection(DEFAULT_CONNECTION_OPTS);
let getStub: sinon.SinonStub;
let postStub: sinon.SinonStub;

describe('src/classes/connection.ts', () => {

  describe('#authenticate', () => {

    beforeEach(() => {
      connection = new Connection(DEFAULT_CONNECTION_OPTS);
      getStub = sinon.stub(request, 'get');
      postStub = sinon.stub(request, 'post');
    });

    afterEach(() => {
      (request.get as sinon.SinonStub).restore();
      (request.post as sinon.SinonStub).restore();
    });

    it('should allow for username/password auth', async () => {
      (request.post as sinon.SinonStub).resolves({
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          access_token: 'accesstoken1234'
        }
      });

      const resp = await connection.authenticate({
        username: 'myusername@test.com',
        password: 'somePassword',
        securityToken: 'abc2343'
      });

      expect(getStub).to.not.have.been.called;
      expect(postStub).to.have.been.called;
      expect(resp).to.be.an('object').with.property('access_token');
    });

  });
});
