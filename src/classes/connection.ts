import IConnectionOpts from '../contracts/IConnectionOpts';
import IOAuthData from '../contracts/IOAuthData';

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
      throw new Error('invalid or missing clientId');
    }

    if (!opts.clientSecret) {
      throw new Error('invalid or missing clientSecret');
    }

    if (!opts.redirectUri) {
      throw new Error('invalid or missing redirectUri');
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

    if (opts.oauth) {
      this.setOAuth(opts.oauth);
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
   * Explicitly set the OAuth data for the connection.
   * @param oauthData
   * @memberof Connection
   */
  public setOAuth(oauthData: IOAuthData) {
    this.oauth = oauthData;
  }
}
