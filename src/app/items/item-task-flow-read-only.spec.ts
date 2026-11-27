import { TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { APPCONFIG } from 'src/app/config';
import { itemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { LocaleService } from 'src/app/services/localeService';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { readyState } from 'src/app/utils/state';
import { ItemTaskFlowService } from './item-task-flow.service';
import { mockItem } from './mocks/item-by-id';
import { Result } from './models/attempts';
import { ItemData } from './models/item-data';
import { HistoryTaskLoadRequest } from './services/history-task-load.request';
import { InitialAnswerDataSource } from './services/initial-answer-datasource';
import { TaskConfig } from './services/item-task.service';
import { fromItemContent } from './store';

const route = itemRoute('activity', '1', { attemptId: '0', path: [] });
const closedDeadline = new Date('2000-01-01T00:00:00Z');
const openDeadline = new Date(backendInfiniteDateString);

function result(allowsSubmissionsUntil: Date): Result {
  return {
    attemptId: '0',
    latestActivityAt: new Date(),
    startedAt: new Date(),
    endedAt: null,
    score: 0,
    validated: false,
    allowsSubmissionsUntil,
  };
}

function itemData(allowsSubmissionsUntil: Date): ItemData {
  return {
    route,
    item: { ...mockItem, id: '1', type: 'Task', url: 'http://example.com/task' },
    breadcrumbs: [],
    currentResult: result(allowsSubmissionsUntil),
  };
}

describe('ItemTaskFlowService – read-only task config for a closed attempt', () => {
  let store: MockStore;
  let service: ItemTaskFlowService;
  let configs: (TaskConfig | null)[];

  function setup(allowsSubmissionsUntil: Date): void {
    TestBed.configureTestingModule({
      providers: [
        ItemTaskFlowService,
        HistoryTaskLoadRequest,
        provideMockStore({
          selectors: [
            { selector: fromItemContent.selectActiveContentRoute, value: route },
            { selector: fromItemContent.selectActiveContentRouteErrorHandlingState, value: null },
            { selector: fromItemContent.selectActiveContentData, value: readyState(itemData(allowsSubmissionsUntil)) },
          ],
        }),
        {
          provide: InitialAnswerDataSource,
          useValue: { answer$: of(null), error$: EMPTY, setInfo: jasmine.createSpy('setInfo') },
        },
        { provide: LocaleService, useValue: { currentLang: { tag: 'en', path: '/en' } } },
        { provide: ConfirmationModalService, useValue: { open: (): typeof EMPTY => EMPTY } },
        { provide: ItemRouter, useValue: { navigateTo: jasmine.createSpy('navigateTo') } },
        { provide: APPCONFIG, useValue: { redirects: [] } },
      ],
    });
    store = TestBed.inject(MockStore);
    service = TestBed.inject(ItemTaskFlowService);
    configs = [];
    service.taskConfig$.subscribe(config => configs.push(config));
    // History's pending load reaches the flow through toObservable, which emits on effect flush.
    TestBed.tick();
  }

  afterEach(() => {
    service.ngOnDestroy();
    TestBed.resetTestingModule();
  });

  it('opens the task read-only when the attempt no longer accepts submissions', () => {
    setup(closedDeadline);
    expect(configs.at(-1)?.readOnly).toBeTrue();
  });

  it('opens the task editable while the attempt accepts submissions', () => {
    setup(openDeadline);
    expect(configs.at(-1)?.readOnly).toBeFalse();
  });

  it('switches to read-only when a refresh shows the deadline has passed while the page is open', () => {
    setup(openDeadline);
    store.overrideSelector(fromItemContent.selectActiveContentData, readyState(itemData(closedDeadline)));
    store.refreshState();
    expect(configs.at(-1)?.readOnly).toBeTrue();
  });

  it('keeps the observed participant on a History load of a closed attempt', () => {
    setup(closedDeadline);
    TestBed.inject(HistoryTaskLoadRequest).request({ attemptId: '0', observedParticipantId: 'u1' });
    TestBed.tick();
    expect(configs.at(-1)).toEqual(jasmine.objectContaining({ readOnly: true, observedParticipantId: 'u1' }));
  });

  it('opens an own History load of a closed attempt read-only', () => {
    setup(closedDeadline);
    TestBed.inject(HistoryTaskLoadRequest).request({ attemptId: '0' });
    TestBed.tick();
    expect(configs.at(-1)?.readOnly).toBeTrue();
  });
});
