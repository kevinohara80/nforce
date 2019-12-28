export default interface AuthenticateOptions {
  code?: string;
  username?: string;
  password?: string;
  securityToken?: string;
  assertion?: string;
  executeOnRefresh?: boolean;
  requestOpts?: {
    [key: string]: string | number | boolean;
  };
}
