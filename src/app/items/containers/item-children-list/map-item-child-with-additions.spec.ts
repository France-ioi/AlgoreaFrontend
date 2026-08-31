import { ItemChildren } from '../../../data-access/get-item-children.service';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { mapChildWithAdditions } from './map-item-child-with-additions';

function makeChild(overrides: Partial<ItemChildren[number]> & { id: string }): ItemChildren[number] {
  const { id, ...rest } = overrides;
  return {
    id,
    type: 'Task',
    order: 0,
    category: 'Undefined',
    permissions: {
      canView: ItemViewPerm.Content,
      canGrantView: ItemGrantViewPerm.None,
      canWatch: ItemWatchPerm.None,
      canEdit: ItemEditPerm.None,
      isOwner: false,
    },
    scoreWeight: 1,
    contentViewPropagation: 'as_info',
    upperViewLevelsPropagation: 'as_is',
    grantViewPropagation: false,
    watchPropagation: false,
    editPropagation: false,
    bestScore: 50,
    string: { title: 'Child', languageTag: 'en', imageUrl: null, subtitle: null },
    results: [
      {
        attemptId: '7',
        latestActivityAt: new Date('2020-01-01'),
        startedAt: new Date('2020-01-01'),
        scoreComputed: 40,
        validated: false,
      },
    ],
    noScore: false,
    displaySettings: displaySettingsSchema.parse({}),
    ...rest,
  };
}

describe('mapChildWithAdditions', () => {
  it('maps result and isLocked from a top-level child', () => {
    const mapped = mapChildWithAdditions(makeChild({ id: '1' }));

    expect(mapped.isLocked).toBe(false);
    expect(mapped.result).toEqual({ attemptId: '7', validated: false, score: 40 });
    expect(mapped.children).toBeUndefined();
  });

  it('recursively maps nested children and preserves empty vs absent', () => {
    const withNested = mapChildWithAdditions(makeChild({
      id: 'parent',
      children: [ makeChild({ id: 'nested', string: { title: 'Nested', languageTag: 'en', imageUrl: null, subtitle: null } }) ],
    }));
    expect(withNested.children?.length).toBe(1);
    expect(withNested.children?.[0]?.id).toBe('nested');
    expect(withNested.children?.[0]?.children).toBeUndefined();

    const emptyNested = mapChildWithAdditions(makeChild({ id: 'empty', children: [] }));
    expect(emptyNested.children).toEqual([]);

    const absentNested = mapChildWithAdditions(makeChild({ id: 'absent' }));
    expect(absentNested.children).toBeUndefined();
  });

  it('marks locked when the user cannot view content', () => {
    const mapped = mapChildWithAdditions(makeChild({
      id: 'locked',
      permissions: {
        canView: ItemViewPerm.Info,
        canGrantView: ItemGrantViewPerm.None,
        canWatch: ItemWatchPerm.None,
        canEdit: ItemEditPerm.None,
        isOwner: false,
      },
    }));
    expect(mapped.isLocked).toBe(true);
  });
});
