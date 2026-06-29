import { canDisplayPlatformLogoInTopBar } from './platform-logo-display';

describe('canDisplayPlatformLogoInTopBar', () => {
  it('is true when the left menu is collapsed or absent', () => {
    expect(canDisplayPlatformLogoInTopBar({
      leftMenuShown: false, hideLeftMenuTree: false, searchActive: false,
    })).toBeTrue();
  });

  it('is true in compact mode (tree hidden) without search active', () => {
    expect(canDisplayPlatformLogoInTopBar({
      leftMenuShown: true, hideLeftMenuTree: true, searchActive: false,
    })).toBeTrue();
  });

  it('is false in compact mode when search is active', () => {
    expect(canDisplayPlatformLogoInTopBar({
      leftMenuShown: true, hideLeftMenuTree: true, searchActive: true,
    })).toBeFalse();
  });

  it('is false when the left menu is shown normally (tree visible)', () => {
    expect(canDisplayPlatformLogoInTopBar({
      leftMenuShown: true, hideLeftMenuTree: false, searchActive: false,
    })).toBeFalse();
  });
});
