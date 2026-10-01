import { readAppVersionFromDocument, readAppVersionFromHtml } from './app-version';

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
});
