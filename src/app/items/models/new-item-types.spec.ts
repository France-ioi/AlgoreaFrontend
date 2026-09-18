import { allowedNewActivityTypes } from './new-item-types';

describe('allowedNewActivityTypes', () => {
  it('should offer only Chapter and Task with left-nav icons', () => {
    expect(allowedNewActivityTypes.map(({ type, title, icon }) => ({ type, title, icon }))).toEqual([
      { type: 'Chapter', title: 'Chapter', icon: 'ph-duotone ph-folder-simple' },
      { type: 'Task', title: 'Task', icon: 'ph-duotone ph-file-text' },
    ]);
  });
});
