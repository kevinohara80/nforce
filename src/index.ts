import APIAuthError from './classes/APIAuthError';
import APIError from './classes/APIError';
import APIRequestError from './classes/APIRequestError';
import Connection from './classes/Connection';
import IConnectionOpts from './contracts/ConnectOptions';

/**
 * Creates a new nforce Connection instance
 *
 * ```typescript
 * const client = createConnection({
 *   clientId: 'XXXXXXXXXXXXXXXXXX',
 *   clientSecret: 'XXXXXXXXXXXXXXXXXXXX',
 *   redirectUri: 'http://localhost:3000'
 * });
 * ```
 *
 * @param opts Options for the connection
 * @returns Connection object
 */
export function createConnection(opts: IConnectionOpts) {
  return new Connection(opts);
}

/**
 * nforce version
 */
// tslint:disable-next-line:no-var-requires
export const version = require('../package.json').version;

export { APIAuthError, APIError, APIRequestError, Connection, IConnectionOpts };
