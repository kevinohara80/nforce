import { Method } from 'axios';

export default interface IAPIRequestOpts {
  resource?: string;
  body?: any;
  method: Method;
  headers?: {
    [key: string]: string;
  };
}
