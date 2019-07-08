import { Response } from 'request';

import APIError from './APIError';

export default class APIRequestError extends APIError {
  public errorCode: string;
  public fields?: string[];

  constructor(res: Response) {
    super(res.body.message, res.statusCode);
    this.errorCode = res.body.errorCode;
    this.fields = res.body.fields;
    this.name = 'APIRequestError';
  }
}
