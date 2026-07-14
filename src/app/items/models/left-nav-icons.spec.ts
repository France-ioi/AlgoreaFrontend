import {
  defaultLeftNavIcon,
  isLeftNavIconOption,
  LEFT_NAV_ICON_OPTIONS,
  resolveLeftNavElementType,
  resolveLeftNavIcon,
  resolveLeftNavIconForType,
} from './left-nav-icons';

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

  it('should resolve element types from category and item metadata', () => {
    expect(resolveLeftNavElementType({ category: 'activity', itemType: 'Chapter' })).toBe('chapter');
    expect(resolveLeftNavElementType({ category: 'activity', itemType: 'Task' })).toBe('task');
    expect(resolveLeftNavElementType({ category: 'activity', hasChildren: true })).toBe('chapter');
    expect(resolveLeftNavElementType({ category: 'skill', itemType: 'Skill' })).toBe('skill-folder');
    expect(resolveLeftNavElementType({ category: 'skill', hasChildren: true })).toBe('skill-folder');
    expect(resolveLeftNavElementType({ category: 'skill', hasChildren: false })).toBe('skill-leaf');
    expect(resolveLeftNavElementType({ category: 'group' })).toBe('group');
  });

  it('should resolve skill category icons', () => {
    expect(resolveLeftNavIcon({ category: 'skill', itemType: 'Skill' })).toBe('ph-folder-simple');
    expect(resolveLeftNavIcon({ category: 'skill', hasChildren: false })).toBe('ph-graduation-cap');
    expect(resolveLeftNavIconForType('skill-leaf')).toBe('ph-graduation-cap');
  });

  it('should resolve icons with locked and custom overrides', () => {
    expect(resolveLeftNavIcon({
      category: 'activity',
      itemType: 'Chapter',
      locked: true,
    })).toBe('ph-folder-simple-lock');
    expect(resolveLeftNavIcon({
      category: 'activity',
      itemType: 'Task',
      locked: true,
    })).toBe('ph-file-lock');
    expect(resolveLeftNavIcon({
      category: 'activity',
      itemType: 'Task',
      leftNavIcon: 'puzzle-piece',
    })).toBe('ph-puzzle-piece');
    expect(resolveLeftNavIcon({ category: 'group' })).toBe('ph-users-three');
  });

  it('should ignore invalid custom icon names', () => {
    expect(resolveLeftNavIconForType('task', false, 'not-in-catalog')).toBe('ph-file-text');
  });
});
