import { Method } from 'axios';

export default interface APIRequestOptions {
  resource?: string;
  body?: any;
  method: Method;
  headers?: {
    [key: string]: string;
  };
}
