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
   * The salesforce instance url
   */
  instance_url: string;
}