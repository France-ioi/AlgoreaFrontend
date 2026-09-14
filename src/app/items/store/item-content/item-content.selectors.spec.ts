import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { Item, State } from './item-content.state';
import { selectors } from './item-content.selectors';
import { itemRoute, resultsFetchKey } from 'src/app/models/routing/item-route';
import { readyState, fetchingState, errorState } from 'src/app/utils/state';
import { Result } from '../../models/attempts';

const testSelectors = selectors<{ itemContent: State }>(state => state.itemContent);

function makeItem(displayOverrides: { hideHeader?: boolean, showPlatformInsteadOfScore?: boolean } = {}): Item {
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
    displaySettings: displaySettingsSchema.parse(displayOverrides),
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
    expect(testSelectors.selectActiveContentHideHeader.projector(makeItem({ hideHeader: true }))).toBe(true);
  });

  it('returns false when the active item has hideHeader disabled', () => {
    expect(testSelectors.selectActiveContentHideHeader.projector(makeItem({ hideHeader: false }))).toBe(false);
  });

  it('returns false when there is no active item', () => {
    expect(testSelectors.selectActiveContentHideHeader.projector(null)).toBe(false);
  });
});

describe('selectActiveContentShowPlatformInsteadOfScore', () => {
  it('returns true when the active item has showPlatformInsteadOfScore enabled', () => {
    expect(testSelectors.selectActiveContentShowPlatformInsteadOfScore.projector(
      makeItem({ showPlatformInsteadOfScore: true }),
    )).toBe(true);
  });

  it('returns false when the active item has showPlatformInsteadOfScore disabled', () => {
    expect(testSelectors.selectActiveContentShowPlatformInsteadOfScore.projector(
      makeItem({ showPlatformInsteadOfScore: false }),
    )).toBe(false);
  });

  it('returns false when there is no active item', () => {
    expect(testSelectors.selectActiveContentShowPlatformInsteadOfScore.projector(null)).toBe(false);
  });
});

describe('selectActiveContentCurrentResult', () => {
  const resultA: Result = {
    attemptId: '42',
    latestActivityAt: new Date(),
    startedAt: new Date(),
    endedAt: null,
    score: 10,
    validated: false,
    allowsSubmissionsUntil: new Date(),
  };
  const resultB: Result = { ...resultA, attemptId: '99', score: 20 };

  it('derives the current result from the route attemptId and the list', () => {
    const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0', attemptId: '99' });
    const resultsState = readyState([ resultA, resultB ], resultsFetchKey(route));
    expect(testSelectors.selectActiveContentCurrentResult.projector(route, resultsState)).toBe(resultB);
  });

  it('returns null when the route has no self attempt', () => {
    const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0' });
    const resultsState = readyState([ resultA ], resultsFetchKey(route));
    expect(testSelectors.selectActiveContentCurrentResult.projector(route, resultsState)).toBeNull();
  });

  it('returns null when the named attempt is absent from the list', () => {
    const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0', attemptId: 'missing' });
    const resultsState = readyState([ resultA ], resultsFetchKey(route));
    expect(testSelectors.selectActiveContentCurrentResult.projector(route, resultsState)).toBeNull();
  });
});

describe('selectActiveContentData', () => {
  const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0', attemptId: '42' });
  const item = makeItem();
  const breadcrumbs = [ { itemId: '1', title: 'T', route } ];
  const result: Result = {
    attemptId: '42',
    latestActivityAt: new Date(),
    startedAt: new Date(),
    endedAt: null,
    score: 0,
    validated: false,
    allowsSubmissionsUntil: new Date(),
  };

  it('returns fetching while attempt resolution is pending', () => {
    const itemState = readyState(item, { id: route.id, observedGroup: route.observedGroup });
    const breadcrumbsState = readyState(breadcrumbs, route);
    const resultsState = readyState([ result ], resultsFetchKey(route));
    const state = testSelectors.selectActiveContentData.projector(
      itemRoute('activity', '1', { path: [], parentAttemptId: '0' }),
      itemState,
      breadcrumbsState,
      resultsState,
      null,
      { kind: 'pick', attemptId: '42' },
    );
    expect(state?.isFetching).toBeTrue();
  });

  it('returns ready data with derived currentResult when resolved', () => {
    const itemState = readyState(item, { id: route.id, observedGroup: route.observedGroup });
    const breadcrumbsState = readyState(breadcrumbs, route);
    const resultsState = readyState([ result ], resultsFetchKey(route));
    const state = testSelectors.selectActiveContentData.projector(
      route,
      itemState,
      breadcrumbsState,
      resultsState,
      result,
      null,
    );
    expect(state?.isReady).toBeTrue();
    expect(state?.data?.currentResult).toBe(result);
    expect(state?.data?.results).toEqual([ result ]);
  });

  it('returns fetching while results are not ready', () => {
    const itemState = readyState(item, { id: route.id, observedGroup: route.observedGroup });
    const breadcrumbsState = readyState(breadcrumbs, route);
    const resultsState = fetchingState(undefined, resultsFetchKey(route));
    const state = testSelectors.selectActiveContentData.projector(
      route,
      itemState,
      breadcrumbsState,
      resultsState,
      null,
      null,
    );
    expect(state?.isFetching).toBeTrue();
  });

  it('returns error when results are in error', () => {
    const itemState = readyState(item, { id: route.id, observedGroup: route.observedGroup });
    const breadcrumbsState = readyState(breadcrumbs, route);
    const err = new Error('start failed');
    const resultsState = errorState(err, resultsFetchKey(route));
    const state = testSelectors.selectActiveContentData.projector(
      route,
      itemState,
      breadcrumbsState,
      resultsState,
      null,
      null,
    );
    expect(state?.isError).toBeTrue();
    expect(state?.error).toBe(err);
  });
});
