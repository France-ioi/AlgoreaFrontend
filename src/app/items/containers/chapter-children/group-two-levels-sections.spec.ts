import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { groupTwoLevelsSections, twoLevelsSectionTrackId } from './group-two-levels-sections';

function child(id: string, type: ItemChildWithAdditions['type']): ItemChildWithAdditions {
  return {
    id,
    type,
    string: { title: id, subtitle: null },
    displaySettings: displaySettingsSchema.parse({}),
    category: 'Undefined',
    bestScore: 0,
    isLocked: false,
  };
}

describe('groupTwoLevelsSections', () => {
  it('groups consecutive tasks and keeps containers separate', () => {
    const sections = groupTwoLevelsSections([
      child('t1', 'Task'),
      child('t2', 'Task'),
      child('c1', 'Chapter'),
      child('t3', 'Task'),
      child('s1', 'Skill'),
    ]);

    expect(sections).toEqual([
      { kind: 'tasks', items: [ child('t1', 'Task'), child('t2', 'Task') ] },
      { kind: 'container', item: child('c1', 'Chapter') },
      { kind: 'tasks', items: [ child('t3', 'Task') ] },
      { kind: 'container', item: child('s1', 'Skill') },
    ]);
  });

  it('builds stable track ids', () => {
    expect(twoLevelsSectionTrackId({ kind: 'tasks', items: [ child('a', 'Task'), child('b', 'Task') ] }))
      .toBe('tasks:a,b');
    expect(twoLevelsSectionTrackId({ kind: 'container', item: child('c', 'Chapter') }))
      .toBe('container:c');
  });
});
