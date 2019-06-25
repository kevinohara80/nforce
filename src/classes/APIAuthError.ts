import { Response } from 'request';

import APIError from './APIError';

export default class APIAuthError extends APIError {

  public error: string;
  public errorDescription?: string;

  constructor(message: string, statusCode: number, description?: string) {
    super(message, statusCode);
    this.error = message;
    this.errorDescription = description;
    this.name = 'APIAuthError';
  }

  public static fromResponse(res: Response) {
    return new APIAuthError(res.body.error, res.statusCode, res.body.error_description);
  }
}
