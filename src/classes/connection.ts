const DEFAULT_AUTH_ENDPOINT = 'https://login.salesforce.com/services/oauth2/authorize';
const DEFAULT_TEST_AUTH_ENDPOINT = 'https://test.salesforce.com/services/oauth2/authorize';
const DEFAULT_LOGIN_ENDPOINT = 'https://login.salesforce.com/services/oauth2/token';
const DEFAULT_TEST_LOGIN_ENDPOINT = 'https://test.salesforce.com/services/oauth2/token';

const DEFAULT_API_VERSION = 44;

export interface IOAuthData {
  /**
   * The salesforce oauth access token
   */
  access_token: string;
  /**
   * The salesforce oauth refresh token
   */
  refresh_token?: string;
  /**
   * The salesforce instance url
   */
  instance_url: string;
}

export interface IConnectionOpts {
  /**
   * The client Id of the connected app.
   */
  clientId: string;
  /**
   * The client secret of the connected app
   */
  clientSecret: string;
  /**
   * The client secret of the connected app
   */
  redirectUri: string;
  /**
   * Specify a particular authEndpoint. Otherwise
   * this defaults to the production endpoint or the
   * sandbox endpoint if `environment: sandbox` is set
   */
  authEndpoint?: string;
  /**
   * Specify a particular loginEndpoint. Otherwise
   * this defaults to the production endpoint or the
   * sandbox endpoint if `environment: sandbox` is set
   */
  loginEndpoint?: string;
  /**
   * The API version of Salesforce used for requests.
   * This should be an integer value for the API version
   * you wish to use.
   * @default https://login.salesforce.com/services/oauth2/token
   */
  apiVersion?: number;
  /**
   * Specify which environment you wish to connect to.
   * @default production
   */
  environment?: 'production' | 'sandbox';
  /**
   * Specify whether or not to use gzip compression when
   * making API requests to Salesforce
   * @default false
   */
  gzip?: boolean;
  /**
   * Configure the connection to attempt an auto-refresh
   * of expired tokens
   * @default false
   */
  autoRefresh?: boolean;
  /**
   * The timeout value in milliseconds for api requests
   * @default null No timeout value set
   */
  timeout?: number;
  /**
   * Optionally provide an OAuth data object obtained
   * from previous authentication.
   */
  oauth?: IOAuthData;
  /**
   * A callback function that is executed when an autoRefresh flow
   * has completed. This is useful for caching or storing the
   * resulting OAuth data that is returned.
   * @param error An Error object returned during the autoRefresh flow
   * @param oauth The OAuth data returned from the autoRefresh flow
   */
  onRefresh?(error: Error | null, oauth: any): void;
}

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
  /**
   * Creates an instance of an nforce Connection.
   * @param {IConnectionOpts} opts Configuration options for
   * the connection
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
   */
  public getAPIVersion(): number {
    return parseInt(this.apiVersion, 10);
  }

  /**
   * Set the current API version for the connection
   * @param {number} apiVersion The integer value of
   * the API version the connection should use
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
   */
  public getOAuth(): IOAuthData | undefined {
    return this.oauth;
  }

  /**
   * Explicitly set the OAuth data for the connection.
   * @param oauthData
   */
  public setOAuth(oauthData: IOAuthData) {
    this.oauth = oauthData;
  }
}
