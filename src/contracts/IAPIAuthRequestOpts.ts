import { Method } from 'axios';

export default interface IAPIAuthRequestOpts {
  uri: string;
  body?: string;
  method?: Method;
  headers?: {
    [key: string]: string;
  };
  executeOnRefresh?: boolean;
}
