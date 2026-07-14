import { formatBreadcrumbs } from './item-breadcrumbs';
import { BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { displaySettingsSchema } from './display-settings';
import { ItemViewPerm } from './item-view-permission';
import { ItemGrantViewPerm } from './item-grant-view-permission';
import { ItemEditPerm } from './item-edit-permission';
import { ItemWatchPerm } from './item-watch-permission';

function makeBreadcrumb(title: string): BreadcrumbItem {
  return {
    itemId: 'item-1',
    title,
    route: {
      id: 'item-1',
      path: [],
      contentType: 'activity',
      attemptId: '0',
    },
  };
}

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    requiresExplicitEntry: false,
    string: { title: 'Current item', description: null, imageUrl: null, subtitle: null, languageTag: 'en' },
    bestScore: 0,
    permissions: {
      canView: ItemViewPerm.Content,
      canGrantView: ItemGrantViewPerm.None,
      canEdit: ItemEditPerm.None,
      canWatch: ItemWatchPerm.None,
      isOwner: false,
      canRequestHelp: false,
    },
    type: 'Task',
    displaySettings: displaySettingsSchema.parse({ leftNavIcon: null }),
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
    url: null,
    usesApi: false,
    defaultLanguageTag: 'en',
    supportedLanguageTags: [ 'en' ],
    ...overrides,
  };
}

describe('item-breadcrumbs', () => {
  const itemRouter = { navigateTo: jasmine.createSpy('navigateTo') } as unknown as ItemRouter;

  it('should format breadcrumbs without icons when no icon context is provided', () => {
    const breadcrumbs = formatBreadcrumbs([ makeBreadcrumb('Parent'), makeBreadcrumb('Current') ], itemRouter);

    expect(breadcrumbs).toEqual([
      { title: 'Parent', navigateTo: jasmine.any(Function) },
      { title: 'Current', navigateTo: jasmine.any(Function) },
    ]);
    expect(breadcrumbs[0]!.icon).toBeUndefined();
    expect(breadcrumbs[1]!.icon).toBeUndefined();
  });

  it('should add a resolved icon only on the last breadcrumb', () => {
    const breadcrumbs = formatBreadcrumbs(
      [ makeBreadcrumb('Parent'), makeBreadcrumb('Current') ],
      itemRouter,
      {
        category: 'activity',
        item: makeItem({
          type: 'Chapter',
          displaySettings: displaySettingsSchema.parse({ leftNavIcon: 'puzzle-piece' }),
        }),
      },
    );

    expect(breadcrumbs[0]!.icon).toBeUndefined();
    expect(breadcrumbs[1]!.icon).toBe('ph-puzzle-piece');
  });

  it('should use locked icons from the real item permissions', () => {
    const breadcrumbs = formatBreadcrumbs(
      [ makeBreadcrumb('Current') ],
      itemRouter,
      {
        category: 'activity',
        item: makeItem({
          type: 'Task',
          permissions: {
            canView: ItemViewPerm.Info,
            canGrantView: ItemGrantViewPerm.None,
            canEdit: ItemEditPerm.None,
            canWatch: ItemWatchPerm.None,
            isOwner: false,
            canRequestHelp: false,
          },
          requiresExplicitEntry: false,
        }),
      },
    );

    expect(breadcrumbs[0]!.icon).toBe('ph-file-lock');
  });
});
