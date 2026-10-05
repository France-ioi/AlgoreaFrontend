import { Item } from 'src/app/data-access/get-item-by-id.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { Duration } from 'src/app/utils/duration';
import {
  shouldResyncParametersBaseline,
  shouldResyncServerBaseline,
  shouldResyncStringsBaseline,
} from './item-edit-wrapper-sync';

function buildItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    requiresExplicitEntry: false,
    string: {
      title: 'My title',
      subtitle: 'Sub',
      description: 'Desc',
      imageUrl: null,
      languageTag: 'en',
    },
    bestScore: 0,
    permissions: {
      canView: ItemViewPerm.Content,
      canGrantView: ItemGrantViewPerm.None,
      canEdit: ItemEditPerm.All,
      canWatch: ItemWatchPerm.None,
      isOwner: true,
      canRequestHelp: false,
      enteringTimeIntervals: [],
    },
    type: 'Chapter',
    displaySettings: displaySettingsSchema.parse({}),
    textId: null,
    validationType: 'None',
    noScore: false,
    allowsMultipleAttempts: false,
    duration: null,
    enteringTimeMin: new Date('1000-01-01T00:00:00Z'),
    enteringTimeMax: new Date('9999-12-31T23:59:59Z'),
    entryParticipantType: 'User',
    entryFrozenTeams: false,
    entryMaxTeamSize: 0,
    entryMinAdmittedMembersRatio: 'None',
    url: '',
    usesApi: false,
    defaultLanguageTag: 'en',
    supportedLanguageTags: [ 'en' ],
    ...overrides,
  };
}

describe('item-edit-wrapper-sync', () => {
  describe('shouldResyncParametersBaseline', () => {
    it('returns false when the previous item is missing or the id changed', () => {
      const curr = buildItem({ requiresExplicitEntry: true });
      expect(shouldResyncParametersBaseline(undefined, curr)).toBe(false);
      expect(shouldResyncParametersBaseline(buildItem({ id: 'other' }), curr)).toBe(false);
    });

    it('returns true when requiresExplicitEntry changes', () => {
      const prev = buildItem({ requiresExplicitEntry: false });
      const curr = buildItem({ requiresExplicitEntry: true });
      expect(shouldResyncParametersBaseline(prev, curr)).toBe(true);
    });

    it('returns true when duration changes', () => {
      const prev = buildItem({ duration: null });
      const curr = buildItem({ duration: Duration.fromHMS(1, 0, 0) });
      expect(shouldResyncParametersBaseline(prev, curr)).toBe(true);
    });

    it('returns false when parameters are unchanged', () => {
      const prev = buildItem({ requiresExplicitEntry: true, allowsMultipleAttempts: true });
      const curr = buildItem({ requiresExplicitEntry: true, allowsMultipleAttempts: true });
      expect(shouldResyncParametersBaseline(prev, curr)).toBe(false);
    });
  });

  describe('shouldResyncServerBaseline', () => {
    it('is true when only strings change', () => {
      const prev = buildItem();
      const curr = buildItem({
        string: { ...prev.string, title: 'Updated title' },
      });
      expect(shouldResyncStringsBaseline(prev, curr)).toBe(true);
      expect(shouldResyncParametersBaseline(prev, curr)).toBe(false);
      expect(shouldResyncServerBaseline(prev, curr)).toBe(true);
    });

    it('is true when only parameters change', () => {
      const prev = buildItem({ requiresExplicitEntry: false });
      const curr = buildItem({ requiresExplicitEntry: true });
      expect(shouldResyncStringsBaseline(prev, curr)).toBe(false);
      expect(shouldResyncParametersBaseline(prev, curr)).toBe(true);
      expect(shouldResyncServerBaseline(prev, curr)).toBe(true);
    });
  });
});
