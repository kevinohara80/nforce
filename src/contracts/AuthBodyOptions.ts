import { ParsedUrlQueryInput } from 'querystring';

export default interface AuthBodyOptions extends ParsedUrlQueryInput {
  client_id: string;
  client_secret?: string;
  redirect_uri?: string;
  grant_type: 'authorization_code' | 'password' | 'assertion' | 'refresh_token';
  code?: string;
  assertion?: string;
  assertion_type?: string;
  refresh_token?: string;
  username?: string;
  password?: string;
}
