import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { Item, State } from './item-content.state';
import { selectors } from './item-content.selectors';

const testSelectors = selectors<{ itemContent: State }>(state => state.itemContent);

function makeItem(hideHeader: boolean): Item {
  return {
    id: '1',
    requiresExplicitEntry: false,
    string: { title: 'Test', description: null, imageUrl: null, subtitle: null, languageTag: 'en' },
    bestScore: 0,
    permissions: {
      canView: ItemViewPerm.Content,
      canGrantView: ItemGrantViewPerm.None,
      canEdit: ItemEditPerm.None,
      canWatch: ItemWatchPerm.None,
      isOwner: false,
      canRequestHelp: false,
    },
    type: 'Chapter',
    displaySettings: displaySettingsSchema.parse({ hideHeader }),
    textId: null,
    validationType: 'None',
    noScore: false,
    allowsMultipleAttempts: false,
    duration: null,
    enteringTimeMin: new Date(),
    enteringTimeMax: new Date(),
    entryParticipantType: 'User',
    entryFrozenTeams: false,
    entryMaxTeamSize: 0,
    entryMinAdmittedMembersRatio: 'None',
    url: 'http://example.com/chapter',
    usesApi: false,
    defaultLanguageTag: 'en',
    supportedLanguageTags: [ 'en' ],
  };
}

describe('selectActiveContentHideHeader', () => {
  it('returns true when the active item has hideHeader enabled', () => {
    expect(testSelectors.selectActiveContentHideHeader.projector(makeItem(true))).toBe(true);
  });

  it('returns false when the active item has hideHeader disabled', () => {
    expect(testSelectors.selectActiveContentHideHeader.projector(makeItem(false))).toBe(false);
  });

  it('returns false when there is no active item', () => {
    expect(testSelectors.selectActiveContentHideHeader.projector(null)).toBe(false);
  });
});
