import { allowedNewActivityTypes } from './new-item-types';

describe('allowedNewActivityTypes', () => {
  it('should offer Chapter, explicit-entry Chapter, and Task with left-nav icons', () => {
    expect(allowedNewActivityTypes.map(({ type, title, icon, requiresExplicitEntry }) => ({
      type,
      title,
      icon,
      requiresExplicitEntry,
    }))).toEqual([
      { type: 'Chapter', title: 'Chapter', icon: 'ph-duotone ph-folder-simple', requiresExplicitEntry: undefined },
      {
        type: 'Chapter',
        title: 'Chapter with manual participation',
        icon: 'ph-duotone ph-folder-simple',
        requiresExplicitEntry: true,
      },
      { type: 'Task', title: 'Task', icon: 'ph-duotone ph-file-text', requiresExplicitEntry: undefined },
    ]);
  });
});
