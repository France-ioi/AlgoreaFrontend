import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EMPTY, merge, Observable, of, Subject, throwError, TimeoutError } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TaskToken } from '../data-access/task-token.service';
import { ItemTaskInitService, IncompatibleTaskApiVersionError, LOAD_TASK_TIMEOUT, TASK_PROXY_FROM_IFRAME } from './item-task-init.service';
import { TaskTokenService } from '../data-access/task-token.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { Task } from '../api/task-proxy';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/utils/state';

const testTimeout = 200;
const route = itemRoute('activity', '1', { attemptId: '0', path: [] });

function createMockTask(): jasmine.SpyObj<Task> {
  const task = jasmine.createSpyObj<Task>('Task', [ 'getMetaData', 'load', 'updateToken', 'destroy', 'bindPlatform' ]);
  task.getMetaData.and.returnValue(of({ usesTokens: false }));
  task.load.and.returnValue(of(undefined));
  return task;
}

describe('ItemTaskInitService – timeout scenarios', () => {
  let service: ItemTaskInitService;
  let iframe: HTMLIFrameElement;
  let taskProxy$: Subject<Task>;

  beforeEach(() => {
    taskProxy$ = new Subject<Task>();

    TestBed.configureTestingModule({
      providers: [
        ItemTaskInitService,
        { provide: LOAD_TASK_TIMEOUT, useValue: testTimeout },
        { provide: TASK_PROXY_FROM_IFRAME, useFactory: () => () => taskProxy$.asObservable() },
        { provide: TaskTokenService, useValue: { generate: () => EMPTY, generateForAnswer: () => EMPTY } },
      ],
    });

    service = TestBed.inject(ItemTaskInitService);
    iframe = document.createElement('iframe');

    service.configure(route, 'http://example.com/task', '0', null, undefined, false);
    service.initTask(iframe, () => {});
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should emit loadedTask and no initError when task loads quickly', fakeAsync(() => {
    const mockTask = createMockTask();
    let initErrorEmitted = false;
    let loadedTaskEmitted = false;

    service.initError$.subscribe(() => initErrorEmitted = true);
    service.loadedTask$.subscribe(() => loadedTaskEmitted = true);

    iframe.dispatchEvent(new Event('load'));
    tick(0);

    tick(50);
    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);

    tick(testTimeout + 100);

    expect(loadedTaskEmitted).withContext('loadedTask$ should have emitted').toBeTrue();
    expect(initErrorEmitted).withContext('initError$ should not have emitted').toBeFalse();
  }));

  it('should show extra delay message then load when task loads slowly but within timeout', fakeAsync(() => {
    const mockTask = createMockTask();
    let initErrorEmitted = false;
    let loadedTaskEmitted = false;

    service.initError$.subscribe(() => initErrorEmitted = true);
    service.loadedTask$.subscribe(() => loadedTaskEmitted = true);

    iframe.dispatchEvent(new Event('load'));
    tick(0);

    // After 75% of timeout, task hasn't loaded yet
    tick(testTimeout * 0.75);
    expect(loadedTaskEmitted).withContext('loadedTask$ should not have emitted yet').toBeFalse();
    expect(initErrorEmitted).withContext('initError$ should not have emitted yet').toBeFalse();

    // Task loads just before timeout
    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);

    expect(loadedTaskEmitted).withContext('loadedTask$ should have emitted after slow load').toBeTrue();

    // Wait past timeout to confirm no error fires
    tick(testTimeout);
    expect(initErrorEmitted).withContext('initError$ should not have emitted after successful load').toBeFalse();
  }));

  it('should emit initError (TimeoutError) when task never calls back', fakeAsync(() => {
    let initError: unknown = null;
    let loadedTaskEmitted = false;

    service.initError$.subscribe(err => initError = err);
    service.loadedTask$.subscribe(() => loadedTaskEmitted = true);

    iframe.dispatchEvent(new Event('load'));
    tick(0);

    // Advance past the full timeout
    tick(testTimeout + 1);

    expect(initError).withContext('initError$ should have emitted a TimeoutError').toBeInstanceOf(TimeoutError);
    expect(loadedTaskEmitted).withContext('loadedTask$ should not have emitted').toBeFalse();
  }));

  it('should emit initError then still emit loadedTask when task loads just after timeout', fakeAsync(() => {
    const mockTask = createMockTask();
    let initError: unknown = null;
    let loadedTaskEmitted = false;

    service.initError$.subscribe(err => initError = err);
    service.loadedTask$.subscribe(() => loadedTaskEmitted = true);

    iframe.dispatchEvent(new Event('load'));
    tick(0);

    // Advance past timeout -> initError fires
    tick(testTimeout + 1);
    expect(initError).withContext('initError$ should have emitted a TimeoutError').toBeInstanceOf(TimeoutError);
    expect(loadedTaskEmitted).withContext('loadedTask$ should not have emitted yet').toBeFalse();

    // Task finally resolves after the timeout
    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);

    expect(loadedTaskEmitted).withContext('loadedTask$ should still emit even after timeout').toBeTrue();
  }));

  it('should transition state$ from error back to ready when task loads after timeout', fakeAsync(() => {
    const mockTask = createMockTask();
    const state$ = merge(
      service.loadedTask$.pipe(map(task => readyState(task))),
      service.initError$.pipe(map(e => errorState(e))),
    ).pipe(startWith(fetchingState()));

    const states: FetchState<Task>[] = [];
    state$.subscribe(s => states.push(s));

    iframe.dispatchEvent(new Event('load'));
    tick(0);

    tick(testTimeout + 1);

    const errState = states[states.length - 1];
    expect(errState?.isError).withContext('state$ should be in error after timeout').toBeTrue();

    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);

    const finalState = states[states.length - 1];
    expect(finalState?.isReady).withContext('state$ should transition to ready after late task load').toBeTrue();
  }));
});

describe('ItemTaskInitService – API version negotiation', () => {
  let service: ItemTaskInitService;
  let iframe: HTMLIFrameElement;
  let taskProxy$: Subject<Task>;

  beforeEach(() => {
    taskProxy$ = new Subject<Task>();

    TestBed.configureTestingModule({
      providers: [
        ItemTaskInitService,
        { provide: LOAD_TASK_TIMEOUT, useValue: testTimeout },
        { provide: TASK_PROXY_FROM_IFRAME, useFactory: () => () => taskProxy$.asObservable() },
        { provide: TaskTokenService, useValue: { generate: () => EMPTY, generateForAnswer: () => EMPTY } },
      ],
    });

    service = TestBed.inject(ItemTaskInitService);
    iframe = document.createElement('iframe');

    service.configure(route, 'http://example.com/task', '0', null, undefined, false);
    service.initTask(iframe, () => {});
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should negotiate api version 2 and set it on the task', fakeAsync(() => {
    const mockTask = createMockTask();
    mockTask.getMetaData.and.returnValue(of({ usesTokens: false, apiVersion: 2, minApiVersion: 1 }));
    let loadedTask: Task | undefined;

    service.loadedTask$.subscribe(task => loadedTask = task);

    iframe.dispatchEvent(new Event('load'));
    tick(0);
    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);

    expect(loadedTask).withContext('loadedTask$ should have emitted').toBe(mockTask);
    expect(mockTask.apiVersion).withContext('task.apiVersion should be negotiated to 2').toBe(2);
  }));

  it('should emit apiVersionError$ when the task API range is incompatible', fakeAsync(() => {
    const mockTask = createMockTask();
    mockTask.getMetaData.and.returnValue(of({ usesTokens: false, apiVersion: 99, minApiVersion: 99 }));
    let apiVersionError: IncompatibleTaskApiVersionError | undefined;
    let loadedTaskEmitted = false;

    service.apiVersionError$.subscribe(err => apiVersionError = err);
    service.loadedTask$.subscribe({
      next: () => loadedTaskEmitted = true,
      error: () => {},
    });

    iframe.dispatchEvent(new Event('load'));
    tick(0);
    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);

    expect(apiVersionError).withContext('apiVersionError$ should have emitted').toBeInstanceOf(IncompatibleTaskApiVersionError);
    expect(loadedTaskEmitted).withContext('loadedTask$ should not have emitted successfully').toBeFalse();
  }));
});

describe('ItemTaskInitService – token refresh', () => {
  let service: ItemTaskInitService;
  let iframe: HTMLIFrameElement;
  let taskProxy$: Subject<Task>;
  let generatedTokenCount: number;
  // overridable per test so failure / sequencing scenarios can be exercised
  let generateFn: () => Observable<TaskToken>;

  function createTokenMockTask(usesTokens = true): jasmine.SpyObj<Task> {
    const task = jasmine.createSpyObj<Task>('Task', [ 'getMetaData', 'load', 'updateToken', 'getViews', 'destroy', 'bindPlatform' ]);
    task.getMetaData.and.returnValue(of({ usesTokens }));
    task.load.and.returnValue(of(undefined));
    task.updateToken.and.returnValue(of(undefined));
    task.getViews.and.returnValue(of({ task: {} }));
    return task;
  }

  function loadTask(mockTask: Task): void {
    iframe.dispatchEvent(new Event('load'));
    tick(0);
    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);
  }

  beforeEach(() => {
    taskProxy$ = new Subject<Task>();
    generatedTokenCount = 0;
    generateFn = (): Observable<TaskToken> => of(`token${++generatedTokenCount}`);

    TestBed.configureTestingModule({
      providers: [
        ItemTaskInitService,
        { provide: LOAD_TASK_TIMEOUT, useValue: testTimeout },
        { provide: TASK_PROXY_FROM_IFRAME, useFactory: () => () => taskProxy$.asObservable() },
        {
          provide: TaskTokenService,
          useValue: { generate: () => generateFn(), generateForAnswer: () => EMPTY },
        },
      ],
    });

    service = TestBed.inject(ItemTaskInitService);
    iframe = document.createElement('iframe');

    service.configure(route, 'http://example.com/task', '0', null, undefined, false);
    service.initTask(iframe, () => {});
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should load the task once with the first token and apply it via updateToken', fakeAsync(() => {
    const mockTask = createTokenMockTask();
    service.loadedTask$.subscribe();

    loadTask(mockTask);

    expect(mockTask.load).withContext('task.load should be called once').toHaveBeenCalledTimes(1);
    expect(mockTask.updateToken).withContext('first token should be applied').toHaveBeenCalledWith('token1');
  }));

  it('should push a new token to the task and emit tokenUpdatedOnTask$ without reloading on refreshToken()', fakeAsync(() => {
    const mockTask = createTokenMockTask();
    let tokenUpdatedCount = 0;
    service.loadedTask$.subscribe();
    service.tokenUpdatedOnTask$.subscribe(() => tokenUpdatedCount++);

    loadTask(mockTask);

    expect(tokenUpdatedCount).withContext('no post-load token push before refresh').toBe(0);
    const updateTokenCallsAfterLoad = mockTask.updateToken.calls.count();

    service.refreshToken();
    tick(0);

    expect(mockTask.load).withContext('task.load should NOT be called again').toHaveBeenCalledTimes(1);
    expect(mockTask.updateToken.calls.count()).withContext('a new token should be pushed').toBe(updateTokenCallsAfterLoad + 1);
    expect(mockTask.updateToken).withContext('the refreshed token should be applied').toHaveBeenCalledWith('token2');
    expect(tokenUpdatedCount).withContext('tokenUpdatedOnTask$ should emit once after refresh').toBe(1);
  }));

  it('should never push a token to a token-less task, even on refreshToken()', fakeAsync(() => {
    const mockTask = createTokenMockTask(false);
    let tokenUpdatedCount = 0;
    service.loadedTask$.subscribe();
    service.tokenUpdatedOnTask$.subscribe(() => tokenUpdatedCount++);

    loadTask(mockTask);

    service.refreshToken();
    tick(0);

    expect(mockTask.updateToken).withContext('token-less task must not receive updateToken').not.toHaveBeenCalled();
    expect(tokenUpdatedCount).withContext('tokenUpdatedOnTask$ must not emit for a token-less task').toBe(0);
  }));

  it('should keep serving the previous token (not error the shared stream) when a refresh generation fails', fakeAsync(() => {
    const mockTask = createTokenMockTask();
    const emittedTokens: TaskToken[] = [];
    let errored = false;
    service.loadedTask$.subscribe();
    service.taskToken$.subscribe({ next: token => emittedTokens.push(token), error: () => errored = true });

    loadTask(mockTask);
    expect(emittedTokens).withContext('initial token should be generated').toEqual([ 'token1' ]);

    // make the refresh-triggered generation fail
    generateFn = (): Observable<TaskToken> => throwError(() => new Error('network blip'));
    service.refreshToken();
    tick(0);

    expect(errored).withContext('taskToken$ must not error on a failed refresh').toBeFalse();
    expect(emittedTokens).withContext('no new token emitted; previous one is kept').toEqual([ 'token1' ]);

    // a later successful submission can still obtain a token
    let latestToken: TaskToken | undefined;
    service.taskToken$.subscribe(token => latestToken = token);
    expect(latestToken).withContext('previous token still available to consumers').toBe('token1');
  }));
});
