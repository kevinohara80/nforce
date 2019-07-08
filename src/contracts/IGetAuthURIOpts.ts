import StandardAPIScopes from './StandardAPIScopes';

export default interface IGetAuthURIOpts {
  /**
   * Any valid response_type that is supported by Salesforce
   * OAuth 2.0. Default is `code`
   */
  responseType?: string;
  /**
   * Override the auth endpoint to use for the token request.
   */
  authEndpoint?: string;
  /**
   * Tailors the login page to the user's device type.
   * Currently the only values supported are `page`, `popup`, and `touch`
   */
  display?: 'page' | 'popup' | 'touch';
  /**
   * Avoid interacting with the user. Default is false.
   */
  immediate?: boolean;
  /**
   * The scope parameter allows you to fine-tune what the
   * client application can access.
   */
  scope?: [StandardAPIScopes | string];
  /**
   * Any value that you wish to be sent with the callback.
   */
  state?: string;
  /**
   * Optional with the openid scope for getting a user ID token.
   */
  nonce?: string;
  /**
   * Specifies how the authorization server prompts the user
   * for re-authentication and reapproval. Values are `login`, `consent` or both in the form of an array.
   */
  prompt?: 'login' | 'consent' | [('login' | 'consent')];
  /**
   * Provide a valid username value with this parameter to
   * pre-populate the login page with the username.
   */
  loginHint?: string;
  /**
   * Specify any other url arguments to include in the
   * request.
   */
  urlOpts?: {
    [key: string]: string | number | boolean;
  };
}
