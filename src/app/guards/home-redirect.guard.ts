import { inject } from '@angular/core';
import { CanActivateFn, UrlTree } from '@angular/router';
import { DEFAULT_ACTIVITY_ROUTE } from 'src/app/config/default-route-tokens';
import { ItemRouter } from '../models/routing/item-router';

export const homeRedirectGuard: CanActivateFn = (): UrlTree => {
  const router = inject(ItemRouter);
  const defaultActivityRoute = inject(DEFAULT_ACTIVITY_ROUTE);
  return router.url(defaultActivityRoute);
};
