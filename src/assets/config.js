/** this is by default populated with the dev config but will be overriden on release */
window.appConfig = {
  apiUrl: 'https://dev.algorea.org/api', // 'http://localhost:3000/api',
  oauthServerUrl: 'https://login.france-ioi.org',

  slsWsUrl: 'wss://fykaym3qnb.execute-api.eu-west-3.amazonaws.com/dev',
  slsApiUrl: 'https://dev.algorea.org/sls',

  searchApiUrl: 'https://jyz57q4k3ytekopv6tvg5bdxaq0vlgso.lambda-url.eu-west-3.on.aws',
  oauthClientId: '43',

  defaultActivityId: '4702',
  defaultSkillId: '3000',
  allUsersGroupId: '3',

  languages: [
    { tag: 'fr', path: '/fr/' },
    { tag: 'de', path: '/de/' },
    { tag: 'it', path: '/it/' },
    { tag: 'en', path: '/' },
  ],
  defaultTitle: 'Algorea Platform',
  languageSpecificTitles: { fr: 'Plateforme Algoréa' },
  allowForcedToken: true,
  authType: 'tokens',

  itemPlatformId: 'algorea_backend',

  theme: 'default',
  featureFlags: {
    enableForum: true,
    hideTaskTabs: [],
    showGroupAccessTab: true,
    showLeftMenuTabs: true,
  },

  redirects: { /* paths to be matched must not have a trailing slash */
    'home': { id: '4702', path: [] },
    'algorea/adventure': { id: '100575556387408660' },
    'officiels/algorea-serious-game/chapter': { id: '1471479157476024035', path: [ '4702' ] },
  },
};
