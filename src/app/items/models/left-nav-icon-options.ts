/**
 * Phosphor icon names selectable as a custom left-nav icon (without the `ph-` prefix).
 * Grouped by theme so related icons appear together in the picker grid.
 */
export const LEFT_NAV_ICON_OPTIONS = [
  // Learning & content
  'books',
  'book-open-text',
  'notepad',
  'certificate',
  'puzzle-piece',
  'lightbulb-filament',
  'video',
  'brain',
  // Programming & files
  'file-py',
  'file-cpp',
  'file-c',
  'code',
  'code-block',
  'laptop',
  // Science & discovery
  'test-tube',
  'magnifying-glass',
  'flashlight',
  'robot',
  'magic-wand',
  // Achievement & games
  'trophy',
  'medal',
  'ranking',
  'strategy',
  'target',
  'seal-check',
  'game-controller',
  // Data & structure
  'database',
  'disc',
  'network',
  'graph',
  'tree-structure',
  // People & social
  'user-rectangle',
  'address-book',
  'handshake',
  'heart',
  'headset',
  // Media
  'camera',
  'images',
  // Organization & lists
  'list-checks',
  'list-bullets',
  'package',
  // Tools & settings
  'wrench',
  'toolbox',
  'gear',
  'sliders-horizontal',
  'sliders',
  'cube',
  // Misc
  'info',
  'question',
  'archive',
] as const;

export type LeftNavIconOption = (typeof LEFT_NAV_ICON_OPTIONS)[number];

export function isLeftNavIconOption(value: string): value is LeftNavIconOption {
  return (LEFT_NAV_ICON_OPTIONS as readonly string[]).includes(value);
}
