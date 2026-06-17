import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { APPCONFIG, AppConfig } from '.';
import { CurrentUserProfile } from '../data-access/current-user.service';
import { UserSessionService } from '../services/user-session.service';
import { LeftMenuConfigService } from './left-menu-config.service';

const profile = (overrides: Partial<CurrentUserProfile> = {}): CurrentUserProfile => ({
  groupId: 'group-1',
  login: 'user',
  profile: {},
  defaultLanguage: 'en',
  tempUser: false,
  ...overrides,
});

const baseConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  apiUrl: 'http://test',
  oauthServerUrl: 'http://oauth',
  oauthClientId: '1',
  defaultActivityId: '1',
  defaultSkillId: 'skill-1',
  allUsersGroupId: '1',
  itemPlatformId: 'test',
  searchApiUrl: 'http://search',
  featureFlags: {
    enableForum: false,
    enableNotifications: false,
    community: 'enabled',
    hideTaskTabs: [],
    showGroupAccessTab: false,
  },
  leftMenuTabs: [
    { type: 'activities', showTo: 'all' },
    { type: 'skills', showTo: 'all' },
    { type: 'groups', showTo: [ 'group-1' ] },
    { type: 'community', showTo: 'all' },
    { type: 'search', showTo: 'all' },
  ],
  ...overrides,
} as AppConfig);

describe('LeftMenuConfigService', () => {
  let session$: BehaviorSubject<CurrentUserProfile | undefined>;
  let service: LeftMenuConfigService;

  const setup = (config: AppConfig): void => {
    session$ = new BehaviorSubject<CurrentUserProfile | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        LeftMenuConfigService,
        { provide: APPCONFIG, useValue: config },
        { provide: UserSessionService, useValue: { session$ } },
      ],
    });
    service = TestBed.inject(LeftMenuConfigService);
  };

  it('returns only showTo: all tabs when session is undefined', async () => {
    setup(baseConfig());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs).toEqual([ 'activities', 'skills', 'community', 'search' ]);
  });

  it('filters tabs by group id in showTo', async () => {
    setup(baseConfig());
    session$.next(profile({ groupId: 'group-1' }));
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs).toEqual([ 'activities', 'skills', 'groups', 'community', 'search' ]);

    session$.next(profile({ groupId: 'other-group' }));
    const otherTabs = await firstValueFrom(service.visibleTabs$);
    expect(otherTabs).not.toContain('groups');
  });

  it('omits skills when defaultSkillId is missing', async () => {
    setup(baseConfig({ defaultSkillId: undefined }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs).not.toContain('skills');
  });

  it('omits search when searchApiUrl is missing', async () => {
    setup(baseConfig({ searchApiUrl: undefined }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs).not.toContain('search');
  });

  it('omits community when featureFlags.community is not enabled', async () => {
    setup(baseConfig({
      featureFlags: {
        enableForum: false,
        enableNotifications: false,
        community: 'disabled',
        hideTaskTabs: [],
        showGroupAccessTab: false,
      },
    }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs).not.toContain('community');
  });

  it('showTabBar$ is false when only activities is visible', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all' },
      ],
    }));
    session$.next(profile());
    const showTabBar = await firstValueFrom(service.showTabBar$);
    expect(showTabBar).toBeFalse();
  });

  it('showTabBar$ is true when a non-activities tab is visible', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all' },
        { type: 'search', showTo: 'all' },
      ],
    }));
    session$.next(profile());
    const showTabBar = await firstValueFrom(service.showTabBar$);
    expect(showTabBar).toBeTrue();
  });
});
