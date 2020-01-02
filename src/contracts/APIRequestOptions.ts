import { Method } from 'axios';

export default interface APIRequestOptions {
  resource?: string;
  body?: unknown;
  method: Method;
  headers?: {
    [key: string]: string;
  };
}
