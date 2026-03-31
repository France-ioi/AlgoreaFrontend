import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APPCONFIG } from 'src/app/config';

export const communityFeatureFlagGuard: CanActivateFn = () => {
  const config = inject(APPCONFIG);
  const router = inject(Router);
  // Returning a UrlTree tells Angular to redirect instead of blocking
  return config.featureFlags.community !== 'disabled' || router.parseUrl('/404');
};
