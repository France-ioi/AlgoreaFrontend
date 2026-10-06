import { readAppVersionFromDocument, readAppVersionFromHtml, toSentryRelease } from './app-version';

describe('app-version', () => {
  describe('readAppVersionFromDocument', () => {
    it('returns the meta content when present', () => {
      const doc = new DOMParser().parseFromString(
        '<html><head><meta name="app-version" content="1.2.3"></head></html>',
        'text/html',
      );
      expect(readAppVersionFromDocument(doc)).toBe('1.2.3');
    });

    it('returns null when the meta tag is missing', () => {
      const doc = new DOMParser().parseFromString('<html><head></head></html>', 'text/html');
      expect(readAppVersionFromDocument(doc)).toBeNull();
    });

    it('returns null when the content is empty', () => {
      const doc = new DOMParser().parseFromString(
        '<html><head><meta name="app-version" content=""></head></html>',
        'text/html',
      );
      expect(readAppVersionFromDocument(doc)).toBeNull();
    });
  });

  describe('readAppVersionFromHtml', () => {
    it('parses the meta from an HTML string', () => {
      expect(readAppVersionFromHtml('<meta name="app-version" content="abc123">')).toBe('abc123');
    });

    it('returns null for empty or missing meta', () => {
      expect(readAppVersionFromHtml('<html></html>')).toBeNull();
      expect(readAppVersionFromHtml('<meta name="app-version" content="">')).toBeNull();
    });
  });

  describe('toSentryRelease', () => {
    it('maps a tagged version to package@version without a leading v', () => {
      expect(toSentryRelease('v2.94.2')).toBe('algorea@2.94.2');
    });

    it('keeps a version that is already without a leading v', () => {
      expect(toSentryRelease('2.94.2')).toBe('algorea@2.94.2');
    });

    it('does not strip a leading v unless a digit follows', () => {
      expect(toSentryRelease('void')).toBe('algorea@void');
    });

    it('returns undefined when the app version is missing', () => {
      expect(toSentryRelease(null)).toBeUndefined();
      expect(toSentryRelease('')).toBeUndefined();
    });
  });
});
