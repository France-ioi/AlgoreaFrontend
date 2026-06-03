import { defaultLeftNavIcon, isLeftNavIconOption, LEFT_NAV_ICON_OPTIONS } from './left-nav-icons';

describe('left-nav-icons', () => {
  it('should return type-specific default icons', () => {
    expect(defaultLeftNavIcon('Task')).toBe('file-text');
    expect(defaultLeftNavIcon('Chapter')).toBe('folder-simple');
  });

  it('should recognize catalog icon names', () => {
    expect(isLeftNavIconOption('puzzle-piece')).toBeTrue();
    expect(isLeftNavIconOption('not-in-catalog')).toBeFalse();
  });

  it('should define a valid icon catalog', () => {
    const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    expect(LEFT_NAV_ICON_OPTIONS).toContain('puzzle-piece');
    expect(new Set(LEFT_NAV_ICON_OPTIONS).size).toBe(LEFT_NAV_ICON_OPTIONS.length);
    for (const icon of LEFT_NAV_ICON_OPTIONS) {
      expect(icon).withContext(icon).toMatch(kebabCasePattern);
    }
  });
});
