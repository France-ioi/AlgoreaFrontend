import { allowedNewActivityTypes } from './new-item-types';

describe('allowedNewActivityTypes', () => {
  it('should offer only Chapter and Task', () => {
    expect(allowedNewActivityTypes.map(({ type, title }) => ({ type, title }))).toEqual([
      { type: 'Chapter', title: 'Chapter' },
      { type: 'Task', title: 'Task' },
    ]);
  });
});
