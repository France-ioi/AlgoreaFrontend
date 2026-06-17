import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { APPCONFIG, AppConfig } from '.';
import { CurrentUserProfile } from '../data-access/current-user.service';
import { UserSessionService } from '../services/user-session.service';
import { LocaleService } from '../services/localeService';
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
    { type: 'activities', showTo: 'all', content: { id: '1', path: [] } },
    { type: 'skills', showTo: 'all', content: { id: 'skill-1', path: [] } },
    { type: 'groups', showTo: [ 'group-1' ] },
    { type: 'community', showTo: 'all' },
    { type: 'search', showTo: 'all' },
  ],
  ...overrides,
} as AppConfig);

describe('LeftMenuConfigService', () => {
  let session$: BehaviorSubject<CurrentUserProfile | undefined>;
  let service: LeftMenuConfigService;

  const setup = (config: AppConfig, currentLangTag?: string): void => {
    session$ = new BehaviorSubject<CurrentUserProfile | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        LeftMenuConfigService,
        { provide: APPCONFIG, useValue: config },
        { provide: UserSessionService, useValue: { session$ } },
        { provide: LocaleService, useValue: { currentLang: currentLangTag ? { tag: currentLangTag, path: '/' } : undefined } },
      ],
    });
    service = TestBed.inject(LeftMenuConfigService);
  };

  it('returns only showTo: all tabs when session is undefined', async () => {
    setup(baseConfig());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs.map(t => t.type)).toEqual([ 'activities', 'skills', 'community', 'search' ]);
    expect(tabs.map(t => t.id)).toEqual([ 0, 1, 2, 3 ]);
  });

  it('filters tabs by group id in showTo', async () => {
    setup(baseConfig());
    session$.next(profile({ groupId: 'group-1' }));
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs.map(t => t.type)).toEqual([ 'activities', 'skills', 'groups', 'community', 'search' ]);

    session$.next(profile({ groupId: 'other-group' }));
    const otherTabs = await firstValueFrom(service.visibleTabs$);
    expect(otherTabs.map(t => t.type)).not.toContain('groups');
  });

  it('omits skills when no skills tab is configured', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] } },
        { type: 'groups', showTo: [ 'group-1' ] },
        { type: 'community', showTo: 'all' },
        { type: 'search', showTo: 'all' },
      ],
    }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs.map(t => t.type)).not.toContain('skills');
  });

  it('omits search when searchApiUrl is missing', async () => {
    setup(baseConfig({ searchApiUrl: undefined }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs.map(t => t.type)).not.toContain('search');
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
    expect(tabs.map(t => t.type)).not.toContain('community');
  });

  it('showTabBar$ is false when only activities is visible', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] } },
      ],
    }));
    session$.next(profile());
    const showTabBar = await firstValueFrom(service.showTabBar$);
    expect(showTabBar).toBeFalse();
  });

  it('showTabBar$ is true when a non-activities tab is visible', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] } },
        { type: 'search', showTo: 'all' },
      ],
    }));
    session$.next(profile());
    const showTabBar = await firstValueFrom(service.showTabBar$);
    expect(showTabBar).toBeTrue();
  });

  it('resolves caption from config default and current language', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] }, caption: { default: 'Content EN', fr: 'Contenu FR' } },
      ],
    }), 'fr');
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs[0]?.caption).toBe('Contenu FR');
  });

  it('falls back to caption default when current language is not defined', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] }, caption: { default: 'Content EN', fr: 'Contenu FR' } },
      ],
    }), 'en');
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs[0]?.caption).toBe('Content EN');
  });

  it('uses default icon when icon is not configured', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] } },
      ],
    }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs[0]?.icon).toBe('ph ph-presentation');
  });

  it('uses configured icon when provided', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] }, icon: 'ph ph-rocket' },
      ],
    }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs[0]?.icon).toBe('ph ph-rocket');
  });

  it('assigns distinct ids to multiple tabs of the same type', async () => {
    setup(baseConfig({
      leftMenuTabs: [
        { type: 'activities', showTo: 'all', content: { id: '1', path: [] } },
        { type: 'activities', showTo: 'all', content: { id: '2', path: [ '1' ] } },
        { type: 'skills', showTo: 'all', content: { id: 'skill-1', path: [] } },
      ],
    }));
    session$.next(profile());
    const tabs = await firstValueFrom(service.visibleTabs$);
    expect(tabs.map(t => ({ id: t.id, type: t.type, content: t.content }))).toEqual([
      { id: 0, type: 'activities', content: { id: '1', path: [] } },
      { id: 1, type: 'activities', content: { id: '2', path: [ '1' ] } },
      { id: 2, type: 'skills', content: { id: 'skill-1', path: [] } },
    ]);
  });
});
