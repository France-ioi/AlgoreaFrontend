import { defaultLeftNavIcon, isLeftNavIconOption, LEFT_NAV_ICON_OPTIONS } from './left-nav-icons';

describe('left-nav-icons', () => {
  it('should return type-specific default icons', () => {
    expect(defaultLeftNavIcon('Task')).toBe('file-text');
    expect(defaultLeftNavIcon('Chapter')).toBe('folder-simple');
  });

  it('should recognize catalog icon names', () => {
    expect(isLeftNavIconOption('puzzle-piece')).toBeTrue();
    expect(isLeftNavIconOption('not-in-catalog')).toBeFalse();
    expect(LEFT_NAV_ICON_OPTIONS.length).toBe(50);
  });
});
