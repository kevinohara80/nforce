import { Response } from 'request';

import APIError from './APIError';

export default class APIRequestError extends APIError {

  public errorCode: string;
  public fields?: string[];

  constructor(message: string, statusCode: number, errorCode: string, fields?: string[]) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.fields = fields;
    this.name = 'APIRequestError';
  }

  public static fromResponse(res: Response) {
    return new APIRequestError(res.body.message, res.statusCode, res.body.errorCode, res.body.fields);
  }
}
