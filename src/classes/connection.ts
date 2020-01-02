import axios, { AxiosResponse } from 'axios';
import * as qs from 'querystring';

//import APIAuthRequestOpts from '../contracts/APIAuthRequestOpts';
// import APIRequestOpts from '../contracts/APIRequestOptions';
import AuthenticateOpts from '../contracts/AuthenticateOptions';
import ConnectionOpts from '../contracts/ConnectOptions';
import GetAuthURIOpts from '../contracts/GetAuthURIOptions';
import OAuthData from '../contracts/OAuthData';

import APIAuthError from './APIAuthError';
// import APIRequestError from './APIRequestError';
import ConnectionError from './ConnectionError';
import AuthURLOptions from '../contracts/AuthURLOptions';
import AuthBodyOptions from '../contracts/AuthBodyOptions';

const DEFAULT_AUTH_ENDPOINT =
  'https://login.salesforce.com/services/oauth2/authorize';
const DEFAULT_TEST_AUTH_ENDPOINT =
  'https://test.salesforce.com/services/oauth2/authorize';
const DEFAULT_LOGIN_ENDPOINT =
  'https://login.salesforce.com/services/oauth2/token';
const DEFAULT_TEST_LOGIN_ENDPOINT =
  'https://test.salesforce.com/services/oauth2/token';
const DEFAULT_API_VERSION = 44;
const SAML_ASSERTION_URN = 'urn:oasis:names:tc:SAML:2.0:profiles:SSO:browser';

export default class Connection {
  // connection properties

  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authEndpoint: string;
  private loginEndpoint: string;
  private apiVersion: string = DEFAULT_API_VERSION.toFixed(0);
  private environment = 'production';
  private gzip = false;
  private autoRefresh = false;
  private timeout = 0;
  private oauth?: OAuthData;
  private username?: string;
  private password?: string;
  private assertion?: string;
  private securityToken?: string;
  private apiCallsUsed?: number;
  private apiCallsLimit?: number;

  /**
   * Creates an instance of an nforce Connection.
   * @param {ConnectionOpts} opts Configuration options for
   * the connection
   * @memberof Connection
   */
  constructor(opts: ConnectionOpts) {
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

    this.apiVersion = opts.apiVersion
      ? opts.apiVersion.toFixed(0)
      : DEFAULT_API_VERSION.toFixed(0);

    this.gzip = opts.gzip || false;
    this.autoRefresh = opts.autoRefresh || false;
    this.timeout = opts.timeout ? Math.floor(opts.timeout) : 0;
    this.oauth = opts.oauth;
    this.username = opts.username;
    this.password = opts.password;
    this.securityToken = opts.securityToken;

    if (
      (this.username || this.password) &&
      (!this.username || !this.password)
    ) {
      throw new ConnectionError(
        'if using username/password authentication, both parameters are requried'
      );
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
   * @returns {(OAuthData | undefined)}
   * @memberof Connection
   */
  public getOAuth(): OAuthData | undefined {
    return this.oauth;
  }

  /**
   * Explicitly set the OAuth object for the connection.
   * @param oauthData
   * @memberof Connection
   */
  public setOAuth(oauthData: OAuthData): void {
    this.oauth = oauthData;
  }

  /**
   * Return the number of API calls used. This value will only be defined
   * after the first authenticated call to the API.
   * @memberof Connection
   */
  public getAPICalls(): number | undefined {
    return this.apiCallsUsed;
  }

  /**
   * Return the API call limit. This value will only be defined
   * after the first authenticated call to the API.
   * @memberof Connection
   */
  public getAPICallsLimit(): number | undefined {
    return this.apiCallsLimit;
  }

  /**
   * Returns an auth uri based on the connection configuration
   * and supplied options
   * @param opts getAuthURI options
   */

  public getAuthUri(opts: GetAuthURIOpts = {}): string {
    let urlOpts: AuthURLOptions = {
      response_type: opts.responseType || 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri
    };

    if (opts.display) {
      urlOpts.display = opts.display.trim().toLowerCase();
    }

    if (opts.scope) {
      if (Array.isArray(opts.scope)) {
        urlOpts.scope = (opts.scope as string[]).map(o => o.trim()).join(' ');
      } else {
        urlOpts.scope = (opts.scope as string).trim();
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
        urlOpts.prompt = (opts.prompt as string[]).map(o => o.trim()).join(' ');
      } else {
        urlOpts.prompt = opts.prompt.trim();
      }
    }

    if (opts.loginHint) {
      urlOpts.login_hint = opts.loginHint.trim();
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
   * @param opts Options for authentication
   * @returns {OAuthData} The OAuth data returned from Salesforce
   */
  public async authenticate(opts: AuthenticateOpts = {}): Promise<OAuthData> {
    const body: AuthBodyOptions = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret
    };

    this.username = opts.username || this.username;
    this.password = opts.password || this.password;
    this.securityToken = opts.securityToken || this.securityToken;
    this.assertion = opts.assertion || this.assertion;

    const refreshToken =
      opts.refreshToken || (this.oauth && this.oauth.refresh_token);

    if (opts.code) {
      body.grant_type = 'authorization_code';
      body.code = opts.code;
      body.redirect_uri = this.redirectUri;
    } else if (refreshToken) {
      body.grant_type = 'refresh_token';
      body.refresh_token = refreshToken;
    } else if (this.assertion) {
      body.grant_type = 'assertion';
      body.assertion_type = SAML_ASSERTION_URN;
      body.assertion = this.assertion;
    } else if (this.username) {
      body.grant_type = 'password';
      body.username = this.username;
      body.password = this.password || '';
      if (this.securityToken) {
        body.password += this.securityToken;
      }
    }

    let resp;

    try {
      resp = await axios.request<OAuthData>({
        url: this.loginEndpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(body),
        timeout: this.timeout
      });
    } catch (err) {
      throw new APIAuthError(err.response as AxiosResponse);
    }

    this.parseResponseHeaders(resp);

    this.oauth = resp.data;

    return resp.data;
  }

  private parseResponseHeaders(res: AxiosResponse): void {
    if (res.headers['sforce-limit-info']) {
      const limitVal = res.headers['sforce-limit-info'] as string;
      const parts = limitVal.split('=')[1].split('/');
      this.apiCallsUsed = parseInt(parts[0], 10);
      this.apiCallsLimit = parseInt(parts[1], 10);
    }
  }

  /**
   * Refresh token
   * @param executeOnRefresh Optionally run the refresh token function
   */
  public async refreshToken(executeOnRefresh = true): Promise<OAuthData> {
    if (!this.oauth) {
      throw new Error(
        'No oauth data found for connection, cannot refresh token'
      );
    }

    const oauth = await this.authenticate();

    if (executeOnRefresh) {
    }

    return oauth;
  }

  // private async apiRequest(uri: string, opts: APIRequestOpts): Promise<any> {
  //   return 'foo';
  // }
}
