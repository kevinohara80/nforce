import * as qs from 'querystring';
import * as request from 'request-promise';

import IAuthenticateOpts from '../contracts/IAuthenticateOpts';
import IConnectionOpts from '../contracts/IConnectionOpts';
import IGetAuthURIOpts from '../contracts/IGetAuthURIOpts';
import IOAuthData from '../contracts/IOAuthData';

import ConnectionError from './ConnectionError';

const DEFAULT_AUTH_ENDPOINT = 'https://login.salesforce.com/services/oauth2/authorize';
const DEFAULT_TEST_AUTH_ENDPOINT = 'https://test.salesforce.com/services/oauth2/authorize';
const DEFAULT_LOGIN_ENDPOINT = 'https://login.salesforce.com/services/oauth2/token';
const DEFAULT_TEST_LOGIN_ENDPOINT = 'https://test.salesforce.com/services/oauth2/token';
const DEFAULT_API_VERSION = 44;

export default class Connection {
  // connection properties

  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authEndpoint: string;
  private loginEndpoint: string;
  private apiVersion: string = DEFAULT_API_VERSION.toFixed(0);
  private environment: string = 'production';
  private gzip: boolean = false;
  private autoRefresh: boolean = false;
  private timeout: number | null = null;
  private oauth?: IOAuthData;
  private username?: string;
  private password?: string;
  private securityToken?: string;

  /**
   * Creates an instance of an nforce Connection.
   * @param {IConnectionOpts} opts Configuration options for
   * the connection
   * @memberof Connection
   */
  constructor(opts: IConnectionOpts) {
    this.environment = opts.environment || 'production';

    if (!opts.clientId) {
      throw new ConnectionError('invalid or missing clientId');
    }

    if (!opts.clientSecret) {
      throw new ConnectionError('invalid or missing clientSecret');
    }

    if (!opts.redirectUri) {
      throw new ConnectionError('invalid or missing redirectUri');
    }

    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.redirectUri = opts.redirectUri;

    if (opts.authEndpoint) {
      this.authEndpoint = opts.authEndpoint;
    } else if (this.environment === 'sandbox') {
      this.authEndpoint = DEFAULT_TEST_AUTH_ENDPOINT;
    } else {
      this.authEndpoint = DEFAULT_AUTH_ENDPOINT;
    }

    if (opts.loginEndpoint) {
      this.loginEndpoint = opts.loginEndpoint;
    } else if (this.environment === 'sandbox') {
      this.loginEndpoint = DEFAULT_TEST_LOGIN_ENDPOINT;
    } else {
      this.loginEndpoint = DEFAULT_LOGIN_ENDPOINT;
    }

    this.apiVersion = opts.apiVersion ? opts.apiVersion.toFixed(0) : DEFAULT_API_VERSION.toFixed(0);

    this.gzip = opts.gzip || false;
    this.autoRefresh = opts.autoRefresh || false;
    this.timeout = opts.timeout ? Math.floor(opts.timeout) : null;
    this.oauth = opts.oauth;
    this.username = opts.username;
    this.password = opts.password;
    this.securityToken = opts.securityToken;

    if ((this.username || this.password) && (!this.username || !this.password)) {
      throw new ConnectionError('if using username/password authentication, both parameters are requried');
    }
  }

  /**
   * Returns the current API version number being used
   * by the connection
   * @returns {number}
   * @memberof Connection
   */
  public getAPIVersion(): number {
    return parseInt(this.apiVersion, 10);
  }

  /**
   * Set the current API version for the connection
   * @param {number} apiVersion The integer value of
   * the API version the connection should use
   * @memberof Connection
   */
  public setAPIVersion(apiVersion: number): void {
    this.apiVersion = apiVersion.toFixed(0);
  }

  /**
   * Get the current OAuth data from the connection. If
   * this value hasn't been set by calling `authenticate()`
   * or hasn't been explicitly set by calling `setOAuth()`,
   * this method will return `undefined`
   * @returns {(IOAuthData | undefined)}
   * @memberof Connection
   */
  public getOAuth(): IOAuthData | undefined {
    return this.oauth;
  }

  /**
   * Explicitly set the OAuth object for the connection.
   * @param oauthData
   * @memberof Connection
   */
  public setOAuth(oauthData: IOAuthData) {
    this.oauth = oauthData;
  }

  /**
   * Returns an auth uri based on the connection configuration
   * and supplied options
   * @param opts getAuthURI options
   */
  public getAuthUri(opts: IGetAuthURIOpts = {}): string {

    let urlOpts: any = {
      response_type: opts.responseType || 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri
    };

    if (opts.display) {
      urlOpts.display = opts.display.toLowerCase();
    }

    if (opts.scope) {
      if (Array.isArray(opts.scope)) {
        urlOpts.scope = opts.scope.join(' ');
      } else {
        urlOpts.scope = opts.scope;
      }
    }

    if (opts.state) {
      urlOpts.state = opts.state;
    }

    if (opts.nonce) {
      urlOpts.nonce = opts.nonce;
    }

    if (opts.prompt) {
      if (Array.isArray(opts.prompt)) {
        urlOpts.prompt = opts.prompt.join(' ');
      } else {
        urlOpts.prompt = opts.prompt;
      }
    }

    if (opts.loginHint) {
      urlOpts.login_hint = opts.loginHint;
    }

    if (opts.urlOpts) {
      urlOpts = {
        ...urlOpts,
        ...opts.urlOpts
      };
    }

    return `${opts.authEndpoint || this.authEndpoint}?${qs.stringify(urlOpts)}`;
  }

  /**
   * This method requests the OAuth access token and
   * instance information from Salesforce.
   * This method either requires that you pass in the
   * authorization code (authorization code flow), username
   * and password (username/password flow), or a SAML
   * assertion (SAML Bearer Assertion Flow).
   * @returns {IOAuthData} The OAuth data returned from Salesforce
   */
  public async authenticate(opts: IAuthenticateOpts = {}): Promise<IOAuthData> {
    opts = {
      executeOnRefresh: false,
      ...opts
    };

    const body: any = {
      client_id: this.clientId,
      client_secret: this.clientSecret
    };

    if (opts.code) {
      body.grant_type = 'authorization_code';
      body.code = opts.code;
      body.redirect_uri = this.redirectUri;
    } else if (opts.assertion) {
      body.grant_type = 'assertion';
      body.assertion_type = 'urn:oasis:names:tc:SAML:2.0:profiles:SSO:browser';
      body.assertion = opts.assertion;
    } else if (opts.username || this.username) {
      body.grant_type = 'password';
      body.username = opts.username || this.username;
      body.password = opts.password || this.password;
      if (opts.securityToken || this.securityToken) {
        body.password += opts.securityToken || this.securityToken;
      }
      this.username = body.username;
      this.password = body.password;
      this.securityToken = body.securityToken;
    }

    const resp = await this.apiAuthRequest({
      uri: this.loginEndpoint,
      method: 'POST',
      body: qs.stringify(body),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return {} as IOAuthData;
  }

  private async apiAuthRequest(opts: any): Promise<any> {
    return 'foo';
  }

  private async apiRequest(): Promise<any> {
    return 'foo';
  }
}
