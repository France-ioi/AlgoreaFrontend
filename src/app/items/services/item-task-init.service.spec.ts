import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EMPTY, merge, of, Subject, throwError, TimeoutError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ItemTaskInitService, LOAD_TASK_TIMEOUT, TASK_PROXY_FROM_IFRAME } from './item-task-init.service';
import { TaskTokenService } from '../data-access/task-token.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { Task } from '../api/task-proxy';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';

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
    const error$ = service.initError$.pipe(switchMap(error => throwError(() => error)));
    const state$ = merge(service.loadedTask$, error$).pipe(mapToFetchState());

    const states: FetchState<Task>[] = [];
    state$.subscribe(s => states.push(s));

    iframe.dispatchEvent(new Event('load'));
    tick(0);

    tick(testTimeout + 1);

    const errorState = states[states.length - 1];
    expect(errorState?.isError).withContext('state$ should be in error after timeout').toBeTrue();

    taskProxy$.next(mockTask);
    taskProxy$.complete();
    tick(0);

    const finalState = states[states.length - 1];
    expect(finalState?.isReady).withContext('state$ should transition to ready after late task load').toBeTrue();
  }));
});
