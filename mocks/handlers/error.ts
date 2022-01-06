import { ErrorRequestHandler } from 'express';

export const errorHandler = (): ErrorRequestHandler => (error, _req, res, next): void => {
  // eslint-disable-next-line no-console
  console.error(error);
  // use "I'm a teapot" error because it's the only status code I'm sure we'll never use in production
  // this code means that a mock-server-only error occurred
  res.status(418);
  if (error instanceof Error) res.json({ name: error.name, message: error.message });
  next();
};
