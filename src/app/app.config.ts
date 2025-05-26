import { InjectionToken } from '@angular/core';
import { z } from 'zod';

const configSchema = z.object({
  apiUrl: z.string(), // full url (not including the trailing slash) of the backend

  forumServerUrl: z.string(), // handle not providing it
  searchApiUrl: z.string().optional(),

  oauthServerUrl: z.string(), // full url (not including the trailing slash) of the oauth server
  oauthClientId: z.string(),

  // the id of the activity/skill to be loaded by default on its tab
  // for the activity, it is also the "home" content, so what is displayed when arriving on "/"
  // this item MUST be on one of all users' root and be implicitely startable
  defaultActivityId: z.string(),
  defaultSkillId: z.string().optional(), // if not given, skills are disabled

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

  theme: z.enum([ 'default', 'coursera-pt' ]).default('default'), // TODO: replace by asset replacement for the domain

  featureFlags: z.object({
    hideTaskTabs: z.array(z.string()).default([]),
    showGroupAccessTab: z.boolean().default(false),
  }),

  /* paths to be matched must not have a trailing slash */
  redirects: z.record(z.string(), z.object({
    id: z.string(),
    path: z.array(z.string()).optional(),
  })).default({}),

});

export const sentryDsnConfigSchema = z.object({ sentryDsn: z.string().optional() });

export type AppConfig = z.infer<typeof configSchema>;

export const APPCONFIG = new InjectionToken<AppConfig>('app.config', {
  factory: (): AppConfig => {
    if (!('appConfig' in window)) {
      throw new Error('No environment config found!');
    }
    const config = configSchema.safeParse(window.appConfig);
    if (!config.success) {
      throw new Error('Error in config! ' + config.error.message);
    }
    delete window.appConfig;
    return config.data;
  },
});

export function getSentryDsnConfig(): string | undefined {
  if (!('appConfig' in window)) {
    throw new Error('No environment config found!');
  }
  const config = sentryDsnConfigSchema.parse(window.appConfig);
  return config.sentryDsn;
}
