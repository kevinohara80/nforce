import { Response } from 'request';

import APIError from './APIError';

/**
 * @category Errors
 */
export default class APIAuthError extends APIError {
  public error: string;
  public errorDescription?: string;

  constructor(res: Response) {
    super(res.body.error, res.statusCode);
    this.error = res.body.error;
    this.errorDescription = res.body.error_description;
    this.name = 'APIAuthError';
  }
}
