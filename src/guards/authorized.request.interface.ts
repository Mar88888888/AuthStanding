import { Request } from 'express';
import { JwtPayload } from './auth.guard';

export interface AuthorizedRequest extends Request {
  user: JwtPayload;
}
