import Connection, { IConnectionOpts } from './classes/connection';

export function createConnection(opts: IConnectionOpts) {
  return new Connection(opts);
}

export { Connection };
