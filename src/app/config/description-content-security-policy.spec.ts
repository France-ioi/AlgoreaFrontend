import { descriptionContentSecurityPolicySchema } from './description-content-security-policy';
import { configSchema } from './index';

const minimalAppConfig = {
  apiUrl: 'http://localhost/api',
  oauthServerUrl: 'http://localhost/oauth',
  oauthClientId: '1',
  defaultActivityId: '1',
  allUsersGroupId: '1',
  itemPlatformId: 'platform',
  featureFlags: {},
  leftMenuTabs: [],
};

describe('descriptionContentSecurityPolicySchema', () => {
  it('accepts http(s) origins with an optional port', () => {
    const result = descriptionContentSecurityPolicySchema.safeParse({
      styleSrc: [ 'https://fonts.googleapis.com', 'http://localhost:8080' ],
      connectSrc: [ 'https://thymio.org', 'wss://example.com:9443' ],
    });
    expect(result.success).toBeTrue();
  });

  it('rejects a wildcard, a scheme-only source, and a path', () => {
    for (const bad of [ '*', 'https:', 'https://example.com/path' ]) {
      expect(descriptionContentSecurityPolicySchema.safeParse({ imgSrc: [ bad ] }).success).toBeFalse();
    }
  });

  it('rejects a ws origin on an image list but accepts it on connectSrc', () => {
    expect(descriptionContentSecurityPolicySchema.safeParse({
      imgSrc: [ 'ws://example.com' ],
    }).success).toBeFalse();
    expect(descriptionContentSecurityPolicySchema.safeParse({
      connectSrc: [ 'ws://example.com' ],
    }).success).toBeTrue();
  });

  it('rejects unknown keys', () => {
    expect(descriptionContentSecurityPolicySchema.safeParse({
      styleSrc: [],
      scriptSrc: [ 'https://evil.example' ],
    }).success).toBeFalse();
  });

  it('treats omitted lists as empty', () => {
    const result = descriptionContentSecurityPolicySchema.safeParse({});
    expect(result.success).toBeTrue();
    if (result.success) {
      expect(result.data.imgSrc).toEqual([]);
      expect(result.data.connectSrc).toEqual([]);
    }
  });
});

describe('configSchema with descriptionContentSecurityPolicy', () => {
  it('accepts a config without the allowlist', () => {
    expect(configSchema.safeParse(minimalAppConfig).success).toBeTrue();
  });

  it('rejects a malformed allowlist entry the same way as other invalid config', () => {
    const result = configSchema.safeParse({
      ...minimalAppConfig,
      descriptionContentSecurityPolicy: {
        imgSrc: [ 'https://example.com/logo.png' ],
      },
    });
    expect(result.success).toBeFalse();
  });

  it('parses a valid allowlist onto the app config', () => {
    const result = configSchema.safeParse({
      ...minimalAppConfig,
      descriptionContentSecurityPolicy: {
        styleSrc: [ 'https://thymio.org' ],
        imgSrc: [ 'https://www.thymio.org' ],
      },
    });
    expect(result.success).toBeTrue();
    if (result.success) {
      expect(result.data.descriptionContentSecurityPolicy?.styleSrc).toEqual([ 'https://thymio.org' ]);
      expect(result.data.descriptionContentSecurityPolicy?.imgSrc).toEqual([ 'https://www.thymio.org' ]);
      expect(result.data.descriptionContentSecurityPolicy?.frameSrc).toEqual([]);
    }
  });
});
