export default interface IOAuthData {
  /**
   * The salesforce oauth access token
   */
  access_token: string;
  /**
   * The salesforce oauth refresh token
   */
  refresh_token?: string;
  /**
   * The uri to the user's identity endpoint
   */
  id?: string;
  /**
   * The salesforce instance url
   */
  instance_url: string;
  /**
   * The type of the token returned by Salesforce
   */
  token_type: string;
  /**
   * The timestamp of the token issue
   */
  issued_at: string;
  /**
   * The token signature string
   */
  signature?: string;
}
