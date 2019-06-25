import APIAuthError from './classes/APIAuthError';
import APIError from './classes/APIError';
import APIRequestError from './classes/APIRequestError';
import Connection from './classes/Connection';
import IConnectionOpts from './contracts/IConnectionOpts';

/**
 * Creates a new nforce Connection instance
 * @param opts Options for the connection
 * @returns Connection object
 */
export function createConnection(opts: IConnectionOpts) {
  return new Connection(opts);
}

export {
  APIAuthError,
  APIError,
  APIRequestError,
  Connection,
  IConnectionOpts
};
