/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { RequestHandler } from 'express';
import { NullableValues, paths } from '../types';

export const operation = (): RequestHandler => (_req, res, next): void => {
  res.operation = <Path extends keyof paths, Method extends keyof paths[Path]>(_path: Path, _method: Method) => ({
    status: <Code extends number>(code: Code) => ({
      send: (response: NullableValues<OperationResponseSchema<paths[Path][Method], Code>>): void => {
        res.status(code).json(response);
      },
    }),
  });
  next();
};

type OperationResponseSchema<T, Code extends number> = T extends {
  responses: {
    [Key in Code]: { schema: infer Schema }
  },
} ? Schema : never;

type OperationResponseCode<T> = T extends { responses: { [Key in infer P]: any } } ? P & number : never;

declare global {
  namespace Express {
    interface Response {
      operation: <Path extends keyof paths, Method extends keyof paths[Path]>(path: Path, method: Method) => {
        status: <Code extends OperationResponseCode<paths[Path][Method]>>(code: Code) => {
          send: (response: NullableValues<OperationResponseSchema<paths[Path][Method], Code>>) => void,
        },
      },
    }
  }
}
