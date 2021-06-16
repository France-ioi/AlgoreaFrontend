import { RequestHandler } from 'express';

export const auth = (): RequestHandler => (req, _res, next): void => {
  req.isAuthenticatedAsDevUser = req.headers.authorization === 'Bearer token123';
  next();
};

declare global {
  namespace Express {
    interface Request {
      isAuthenticatedAsDevUser: boolean;
    }
  }
}
