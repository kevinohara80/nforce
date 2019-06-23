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

export { Connection };
