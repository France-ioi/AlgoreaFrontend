import { bundleAssetUrl } from './deploy-url';

describe('bundleAssetUrl', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('resolves next to the running bundle even when a foreign absolute script is injected first', () => {
    document.head.innerHTML = '<script src="//stats.france-ioi.org/matomo.js"></script>';
    const expected = `${new URL('.', import.meta.url).href}assets/scripts/device-proxy-platform.js`;

    expect(bundleAssetUrl('scripts/device-proxy-platform.js')).toBe(expected);
  });
});
