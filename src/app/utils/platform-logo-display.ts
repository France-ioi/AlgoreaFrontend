/**
 * Whether the platform logo is not currently shown in the left menu, so the content top bar may
 * show it instead. The left menu shows the logo by default; it doesn't when it is collapsed
 * (`!leftMenuShown`, which also covers "no left menu at all", e.g. LTI), or when it is in compact
 * mode (tree hidden) without search active (search re-expands the left-header logo).
 * Whether the logo actually appears also depends on the active item's `showPlatformInsteadOfScore`
 * display setting.
 */
export function canDisplayPlatformLogoInTopBar({ leftMenuShown, hideLeftMenuTree, searchActive }: {
  leftMenuShown: boolean,
  hideLeftMenuTree: boolean,
  searchActive: boolean,
}): boolean {
  return !leftMenuShown || (hideLeftMenuTree && !searchActive);
}
