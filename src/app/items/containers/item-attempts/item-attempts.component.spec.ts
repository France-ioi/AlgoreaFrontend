import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';
import { AttemptActionsService } from 'src/app/data-access/attempt-actions.service';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { displaySettingsSchema } from 'src/app/items/models/display-settings';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { fromItemContent } from 'src/app/items/store';
import { itemRoute, newAttemptId, ResultsFetchKey, resultsFetchKey } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { fromObservation } from 'src/app/store/observation';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/utils/state';
import { Result } from '../../models/attempts';
import { ItemAttemptsComponent } from './item-attempts.component';

const baseRoute = itemRoute('activity', '1', { path: [ 'p' ], parentAttemptId: '0', attemptId: '42' });
const key = resultsFetchKey(baseRoute);

const baseItem: Item = {
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
  type: 'Task',
  displaySettings: displaySettingsSchema.parse({}),
  textId: null,
  validationType: 'None',
  noScore: false,
  allowsMultipleAttempts: true,
  duration: null,
  enteringTimeMin: new Date(),
  enteringTimeMax: new Date(),
  entryParticipantType: 'User',
  entryFrozenTeams: false,
  entryMaxTeamSize: 0,
  entryMinAdmittedMembersRatio: 'None',
  url: 'http://example.com/task',
  usesApi: false,
  defaultLanguageTag: 'en',
  supportedLanguageTags: [ 'en' ],
};

function makeResult(attemptId: string, startedAt: Date): Result {
  return {
    attemptId,
    latestActivityAt: startedAt,
    startedAt,
    endedAt: null,
    score: 10,
    validated: false,
    allowsSubmissionsUntil: new Date('2090-01-01'),
  };
}

describe('ItemAttemptsComponent', () => {
  let fixture: ComponentFixture<ItemAttemptsComponent>;
  let store: MockStore;
  let itemRouter: jasmine.SpyObj<Pick<ItemRouter, 'navigateTo' | 'url'>>;
  let attemptActions: jasmine.SpyObj<Pick<AttemptActionsService, 'create'>>;
  let actionFeedback: jasmine.SpyObj<Pick<ActionFeedbackService, 'error'>>;

  beforeEach(async () => {
    itemRouter = jasmine.createSpyObj('ItemRouter', [ 'navigateTo', 'url' ]);
    attemptActions = jasmine.createSpyObj('AttemptActionsService', [ 'create' ]);
    actionFeedback = jasmine.createSpyObj('ActionFeedbackService', [ 'error' ]);
    itemRouter.url.and.returnValue('/a/1' as never);

    await TestBed.configureTestingModule({
      imports: [ ItemAttemptsComponent ],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectActiveContentItem, value: baseItem },
            {
              selector: fromItemContent.selectActiveContentResultsState,
              value: readyState([ makeResult('42', new Date('2020-01-01')) ], key),
            },
            { selector: fromItemContent.selectActiveContentRoute, value: baseRoute },
            { selector: fromItemContent.selectAttemptResolution, value: null },
            { selector: fromObservation.selectIsObserving, value: false },
          ],
        }),
        { provide: ItemRouter, useValue: itemRouter },
        { provide: AttemptActionsService, useValue: attemptActions },
        { provide: ActionFeedbackService, useValue: actionFeedback },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(ItemAttemptsComponent);
    fixture.detectChanges();
  });

  function setState(options: {
    item?: Item | null,
    resultsState?: FetchState<Result[], ResultsFetchKey>,
    route?: typeof baseRoute | null,
    attemptResolution?: { kind: 'pick', attemptId: string } | { kind: 'start' } | null,
    isObserving?: boolean,
  }): void {
    if (options.item !== undefined) {
      store.overrideSelector(fromItemContent.selectActiveContentItem, options.item);
    }
    if (options.resultsState !== undefined) {
      store.overrideSelector(fromItemContent.selectActiveContentResultsState, options.resultsState);
    }
    if (options.route !== undefined) {
      store.overrideSelector(fromItemContent.selectActiveContentRoute, options.route);
    }
    if (options.attemptResolution !== undefined) {
      store.overrideSelector(fromItemContent.selectAttemptResolution, options.attemptResolution);
    }
    if (options.isObserving !== undefined) {
      store.overrideSelector(fromObservation.selectIsObserving, options.isObserving);
    }
    store.refreshState();
    fixture.detectChanges();
  }

  function createButton(): HTMLButtonElement | undefined {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Create a new attempt'));
  }

  it('shows the unsupported message when multiple attempts are not allowed', () => {
    setState({ item: { ...baseItem, allowsMultipleAttempts: false } });
    expect(fixture.nativeElement.textContent).toContain('This content does not support multiple attempts.');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('shows the intro and table when attempts exist', () => {
    expect(fixture.nativeElement.textContent).toContain('This content allows creating multiple attempts');
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('active');
    expect(fixture.nativeElement.textContent).toContain('Create a new attempt');
  });

  it('shows Select for non-current attempts and active for the current one', () => {
    const older = makeResult('10', new Date('2019-01-01'));
    const current = makeResult('42', new Date('2020-01-01'));
    setState({
      resultsState: readyState([ older, current ], key),
      route: { ...baseRoute, attemptId: '42' },
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('active');
    expect(text).toContain('Select');
  });

  it('does not offer Select for never-started attempts', () => {
    const notStarted: Result = {
      ...makeResult('10', new Date('2019-01-01')),
      startedAt: null,
    };
    setState({
      resultsState: readyState([ notStarted, makeResult('42', new Date('2020-01-01')) ], key),
      route: { ...baseRoute, attemptId: '42' },
    });
    const selectButtons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).filter(b => b.textContent?.includes('Select'));
    expect(selectButtons.length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('active');
  });

  it('shows empty explicit-entry messages when there are no results', () => {
    setState({
      item: { ...baseItem, requiresExplicitEntry: true },
      resultsState: readyState([], key),
      route: itemRoute('activity', '1', { path: [ 'p' ], parentAttemptId: '0' }),
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('This content does not have an attempt yet.');
    expect(text).toContain('content tab');
  });

  it('hides create and select actions while observing', () => {
    const older = makeResult('10', new Date('2019-01-01'));
    setState({
      resultsState: readyState([ older, makeResult('42', new Date('2020-01-01')) ], key),
      isObserving: true,
    });
    expect(fixture.nativeElement.textContent).not.toContain('Create a new attempt');
    expect(fixture.nativeElement.textContent).not.toContain('Select');
  });

  it('hides create while attempt resolution is pending', () => {
    setState({ attemptResolution: { kind: 'start' } });
    expect(createButton()).toBeUndefined();
  });

  it('creates an attempt, dispatches a provisional result, navigates, and re-enables create', () => {
    attemptActions.create.and.returnValue(of('99'));
    const button = createButton();
    expect(button).toBeTruthy();
    button!.click();
    fixture.detectChanges();

    expect(attemptActions.create).toHaveBeenCalledOnceWith([ 'p', '1' ], '0');
    expect(store.dispatch).toHaveBeenCalled();
    const action = (store.dispatch as jasmine.Spy).calls.mostRecent().args[0] as ReturnType<
      typeof fromItemContent.itemByIdPageActions.attemptStarted
    >;
    expect(action.result.attemptId).toBe('99');
    expect(action.result.endedAt).toBeNull();
    expect(action.result.allowsSubmissionsUntil).toEqual(new Date(backendInfiniteDateString));
    expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(
      { ...baseRoute, attemptId: '99' },
      { useCurrentObservation: true },
    );
    expect(createButton()?.disabled).toBeFalse();
  });

  it('shows an error toast when create fails and re-enables create', () => {
    attemptActions.create.and.returnValue(throwError(() => new Error('fail')));
    createButton()!.click();
    fixture.detectChanges();
    expect(actionFeedback.error).toHaveBeenCalledTimes(1);
    expect(itemRouter.navigateTo).not.toHaveBeenCalled();
    expect(createButton()?.disabled).toBeFalse();
  });

  it('requests a new attempt via a=new and navigates to the content tab', () => {
    setState({
      item: { ...baseItem, requiresExplicitEntry: true },
      resultsState: readyState([ makeResult('42', new Date('2020-01-01')) ], key),
    });
    createButton()!.click();
    expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(
      { ...baseRoute, attemptId: newAttemptId },
      {
        page: [],
        useCurrentObservation: true,
        navExtras: { replaceUrl: true },
      },
    );
  });

  it('offers create for explicit-entry items with info-only view permission', () => {
    setState({
      item: {
        ...baseItem,
        requiresExplicitEntry: true,
        permissions: { ...baseItem.permissions, canView: ItemViewPerm.Info },
      },
      resultsState: readyState([ makeResult('42', new Date('2020-01-01')) ], key),
    });
    expect(createButton()).toBeDefined();
    createButton()!.click();
    expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(
      { ...baseRoute, attemptId: newAttemptId },
      {
        page: [],
        useCurrentObservation: true,
        navExtras: { replaceUrl: true },
      },
    );
  });

  it('hides create for non-explicit-entry items with info-only view permission', () => {
    setState({
      item: {
        ...baseItem,
        requiresExplicitEntry: false,
        permissions: { ...baseItem.permissions, canView: ItemViewPerm.Info },
      },
    });
    expect(createButton()).toBeUndefined();
  });

  it('does not call the create API when createAttempt is invoked without content permission', () => {
    setState({
      item: {
        ...baseItem,
        requiresExplicitEntry: false,
        permissions: { ...baseItem.permissions, canView: ItemViewPerm.Info },
      },
    });
    (fixture.componentInstance as unknown as { createAttempt(): void }).createAttempt();
    expect(attemptActions.create).not.toHaveBeenCalled();
  });

  it('shows the visit-content message when the route already has a=new', () => {
    setState({
      item: { ...baseItem, requiresExplicitEntry: true },
      resultsState: readyState([ makeResult('42', new Date('2020-01-01')) ], key),
      route: itemRoute('activity', '1', { path: [ 'p' ], parentAttemptId: '0', attemptId: newAttemptId }),
    });
    expect(fixture.nativeElement.textContent).toContain('content tab');
  });

  it('shows loading state', () => {
    setState({ resultsState: fetchingState(undefined, key) });
    expect(fixture.nativeElement.querySelector('alg-loading')).toBeTruthy();
  });

  it('shows error state', () => {
    setState({ resultsState: errorState(new Error('x'), key) });
    expect(fixture.nativeElement.querySelector('alg-error')).toBeTruthy();
  });
});
