import { ParsedUrlQueryInput } from 'querystring';

export default interface AuthUrlOptions extends ParsedUrlQueryInput {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  display?: string;
  scope?: string;
  nonce?: string;
  state?: string;
  prompt?: string;
  login_hint?: string;
}
