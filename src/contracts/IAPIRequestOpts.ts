import { AllowedMethod } from './AllowedMethod';

export default interface IAPIRequestOpts {
  resource?: string;
  body?: any;
  method: AllowedMethod;
  headers?: {
    [key: string]: string;
  };
}
