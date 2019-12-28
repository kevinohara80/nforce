import { Method } from 'axios';

export default interface APIAuthRequestOpts {
  uri: string;
  body?: string;
  method?: Method;
  headers?: {
    [key: string]: string;
  };
  executeOnRefresh?: boolean;
}
