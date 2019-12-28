import { AxiosResponse } from 'axios';
import { Response } from 'request';

import APIError from './APIError';

/**
 * @category Errors
 */
export default class APIAuthError extends APIError {
  public error: string;
  public errorDescription?: string;

  constructor(res: AxiosResponse) {
    super(res.data.error, res.status);
    this.error = res.data.error;
    this.errorDescription = res.data.error_description;
    this.name = 'APIAuthError';
  }
}
