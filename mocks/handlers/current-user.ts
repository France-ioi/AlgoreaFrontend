import '../middlewares/auth';
import '../middlewares/operation';
import { Router } from 'express';
import { definitions, NullableValues } from '../types';
import { devUser } from '../dataset/users/devUser';
import { tempUser } from '../dataset/users/tempUser';

const router = Router();

// mock the session by keeping a currentUser in server memory
let currentUser: NullableValues<definitions['userData']> | null = null;

router.get('/api/current-user', (req, res, next) => {
  currentUser = req.isAuthenticatedAsDevUser ? devUser : tempUser;
  res
    .operation('/current-user', 'get')
    .status(200)
    .send(currentUser);
  next();
});

router.put('/api/current-user', (req, res, next) => {
  Object.assign(currentUser as any, req.body);
  res
    .operation('/current-user', 'put')
    .status(200)
    .send({ message: 'updated', success: true });
  next();
});

router.delete('/api/current-user', (_req, res, next) => {
  // res
  //   .operation('/current-user', 'delete')
  //   .status(200)
  //   .send({ message: 'deleted', success: false });
  res
    .operation('/current-user', 'delete')
    .status(401)
    .send({ message: 'Unauthorized', success: false, error_text: 'Error: unauthorized' });
  next();
});

export default router;
