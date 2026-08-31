import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { planTwoLevelsContainerChildren } from './plan-two-levels-container-children';

function makeItem(overrides: Partial<ItemChildWithAdditions> = {}): ItemChildWithAdditions {
  return {
    id: 'c1',
    string: { title: 'Child' },
    displaySettings: displaySettingsSchema.parse({}),
    category: 'Undefined',
    type: 'Chapter',
    bestScore: 0,
    isLocked: false,
    ...overrides,
  };
}

describe('planTwoLevelsContainerChildren', () => {
  it('shows locked when the user cannot view content', () => {
    expect(planTwoLevelsContainerChildren(makeItem({ isLocked: true }))).toEqual({ action: 'showLocked' });
  });

  it('shows explicit-entry message when there is no result and entry is required', () => {
    expect(planTwoLevelsContainerChildren(makeItem({ requiresExplicitEntry: true }))).toEqual({
      action: 'showExplicitEntry',
    });
  });

  it('plans start-and-fetch when there is no result and entry is not required', () => {
    expect(planTwoLevelsContainerChildren(makeItem({}))).toEqual({ action: 'startAndFetch' });
    expect(planTwoLevelsContainerChildren(makeItem({ requiresExplicitEntry: false }))).toEqual({
      action: 'startAndFetch',
    });
  });

  it('uses nested children when a result is elected and children are present', () => {
    const children: ItemChildWithAdditions[] = [];
    expect(planTwoLevelsContainerChildren(makeItem({
      result: { attemptId: 'a1', validated: false, score: 0 },
      children,
    }))).toEqual({ action: 'useNested', children, attemptId: 'a1' });
  });

  it('plans fetch when a result is elected but nested children are absent', () => {
    expect(planTwoLevelsContainerChildren(makeItem({
      result: { attemptId: 'a2', validated: true, score: 10 },
    }))).toEqual({ action: 'fetch', attemptId: 'a2' });
  });
});
