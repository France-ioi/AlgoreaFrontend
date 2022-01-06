import { RequestHandler } from 'express';
import { environment } from '../environment';

export const auth = (): RequestHandler => (req, _res, next): void => {
  req.isAuthenticatedAsDevUser = req.headers.authorization === `Bearer ${environment.devUserToken}`;
  next();
};

declare global {
  namespace Express {
    interface Request {
      isAuthenticatedAsDevUser: boolean,
    }
  }
}
