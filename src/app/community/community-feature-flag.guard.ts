import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { APPCONFIG } from 'src/app/config';

export const communityFeatureFlagGuard: CanActivateFn = (): boolean | UrlTree => {
  const config = inject(APPCONFIG);
  const router = inject(Router);
  return config.featureFlags.enableCommunity || router.parseUrl('/404');
};
