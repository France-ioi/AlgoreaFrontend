import { TestBed } from '@angular/core/testing';
import { GuardResult, provideRouter, Router, UrlTree } from '@angular/router';
import { APPCONFIG, AppConfig } from 'src/app/config';
import { communityGuard } from './community.guard';

const baseConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  apiUrl: 'http://test',
  oauthServerUrl: 'http://oauth',
  oauthClientId: '1',
  defaultActivityId: '1',
  allUsersGroupId: '1',
  itemPlatformId: 'test',
  featureFlags: {
    enableForum: false,
    enableNotifications: false,
    hideTaskTabs: [],
    showGroupAccessTab: false,
  },
  leftMenuTabs: [],
  ...overrides,
} as AppConfig);

describe('communityGuard', () => {
  const runGuard = (config: AppConfig): GuardResult => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: APPCONFIG, useValue: config },
      ],
    });
    return TestBed.runInInjectionContext(() => communityGuard(null!, null!)) as GuardResult;
  };

  it('returns true when leftMenuTabs contains a community tab', () => {
    const result = runGuard(baseConfig({
      leftMenuTabs: [ { type: 'community', showTo: 'all' } ],
    }));
    expect(result).toBeTrue();
  });

  it('returns a /404 UrlTree when community tab is not configured', () => {
    const result = runGuard(baseConfig({
      leftMenuTabs: [ { type: 'activities', showTo: 'all', content: { id: '1', path: [] } } ],
    }));
    expect(result instanceof UrlTree).toBeTrue();
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/404');
  });
});
