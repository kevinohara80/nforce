import IOAuthData from './IOAuthData';

export default interface IConnectionOpts {
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
   * The username for password-based authentication
   */
  username?: string;
  /**
   * The password for password-based authentication
   */
  password?: string;
  /**
   * The security token for password-based authentication
   */
  securityToken?: string;
  /**
   * A callback function that is executed when an autoRefresh flow
   * has completed. This is useful for caching or storing the
   * resulting OAuth data that is returned.
   * @param error An Error object returned during the autoRefresh flow
   * @param oauth The OAuth data returned from the autoRefresh flow
   */
  onRefresh?(error: Error | null, oauth: any): void;
}
