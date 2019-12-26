import { AllowedMethod } from './AllowedMethod';

export default interface IAPIAuthRequestOpts {
  uri: string;
  body?: string;
  method?: AllowedMethod;
  headers?: {
    [key: string]: string;
  };
}
