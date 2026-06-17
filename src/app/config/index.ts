import { InjectionToken } from '@angular/core';
import { z } from 'zod';

const userSet = z.union([
  z.enum([ 'all', 'tempUsers', 'nonTempUsers' ]),
  z.array(z.string()), // user's groupIds
]);

export type UserSet = z.infer<typeof userSet>;

const tabContent = z.object({ id: z.string(), path: z.array(z.string()).default([]) });

const configSchema = z.object({
  apiUrl: z.string(), // full url (not including the trailing slash) of the backend

  slsApiUrl: z.string().optional(),
  slsWsUrl: z.string().optional(),

  searchApiUrl: z.string().optional(),

  oauthServerUrl: z.string(), // full url (not including the trailing slash) of the oauth server
  oauthClientId: z.string(),

  // the id of the activity to be loaded by default on "/"
  // this item MUST be on one of all users' root and be implicitely startable
  defaultActivityId: z.string(),

  // groupId of the all-users group used by the backend (used while the backend cannot provide us with it)
  allUsersGroupId: z.string(),

  // To add a default/fallback language, use a config with path = "/" and place it at the end.
  languages: z.array(z.object({
    tag: z.string(),
    path: z.string(),
  })).default([{ tag: 'en', path: '/' }]),

  // Name for the website (on top of the left menu and as html 'title')
  defaultTitle: z.string().default('Algorea'),
  languageSpecificTitles: z.record(z.string(), z.string()).default({}), // e.g., { en: 'My English title', fr: 'Mon titre français' }
  leftHeaderLogoUrl: z.string().optional(),

  // The authType used with API is either 'tokens' or 'cookies'.
  authType: z.enum([ 'tokens', 'cookies' ]).default('cookies'),
  // for dev: allow devs to define 'forced_token' in storage (preferred over all auth)
  allowForcedToken: z.boolean().default(false),

  itemPlatformId: z.string(),

  featureFlags: z.object({
    enableForum: z.boolean().default(false),
    community: z.enum([ 'disabled', 'notInNav', 'enabled' ]).default('disabled'),
    enableNotifications: z.boolean().default(false),

    hideTaskTabs: z.array(z.string()).default([]),
    showGroupAccessTab: z.boolean().default(false),
  }),

  /* paths to be matched must not have a trailing slash */
  redirects: z.record(z.string(), z.object({
    id: z.string(),
    path: z.array(z.string()).optional(),
  })).default({}),

  // item ids on which the left navigation tree is hidden (only the tab bar is shown)
  hideLeftMenuTreeOnItemIds: z.array(z.string()).default([]),

  leftMenuTabs: z.array(z.intersection(
    z.object({ showTo: userSet.default('all') }),
    z.union([
      z.object({ type: z.literal('activities'), content: tabContent }),
      z.object({ type: z.literal('skills'), content: tabContent }),
      z.object({ type: z.literal('groups') }),
      z.object({ type: z.literal('community') }),
      z.object({ type: z.literal('search') }),
    ]),
  )),

});

export type AppConfig = z.infer<typeof configSchema>;
export type LeftMenuTabType = AppConfig['leftMenuTabs'][number]['type'];

let cachedConfig: AppConfig | null = null;

export const APPCONFIG = new InjectionToken<AppConfig>('app.config', {
  factory: (): AppConfig => {
    // Return cached config if already loaded
    if (cachedConfig !== null) {
      return cachedConfig;
    }

    if (!('appConfig' in window)) {
      throw new Error('No environment config found! Make sure assets/config.js is loaded before Angular bootstraps.');
    }
    const config = configSchema.safeParse(window.appConfig);
    if (!config.success) {
      throw new Error('Error in config! ' + config.error.message);
    }

    // Cache the config but don't delete from window yet (for safety)
    cachedConfig = config.data;

    // Delete from window to prevent tampering, but only after successful parse and cache
    delete window.appConfig;

    return cachedConfig;
  },
});
