import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APPCONFIG } from 'src/app/config';
import { isCommunityConfigured } from 'src/app/config/community-config';

// Checks only that a community tab is present in config (not per-user showTo).
// Tab visibility per session is handled by LeftMenuConfigService; server-side access control remains authoritative.
export const communityGuard: CanActivateFn = () => {
  const config = inject(APPCONFIG);
  const router = inject(Router);
  return isCommunityConfigured(config) || router.parseUrl('/404');
};
