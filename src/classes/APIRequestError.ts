import { AxiosResponse } from 'axios';

import APIError from './APIError';

/**
 * @category Errors
 */
export default class APIRequestError extends APIError {
  public errorCode: string;
  public fields?: string[];

  constructor(res: AxiosResponse) {
    super(res.data.message, res.status);
    this.errorCode = res.data.errorCode;
    this.fields = res.data.fields;
    this.name = 'APIRequestError';
  }
}
