import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { Task } from '../api/task-proxy';
import { HistoryRestore, HistoryRestoreRequest } from './history-restore.request';
import { listenForHistoryRestore } from './listen-for-history-restore';

describe('listenForHistoryRestore', () => {
  it('calls reloadHistory for a read-only (observer) task on the matching attempt', () => {
    TestBed.configureTestingModule({});
    const destroyRef = TestBed.inject(DestroyRef);
    const pending$ = new BehaviorSubject<HistoryRestore | null>(null);
    const consume = jasmine.createSpy('consume');
    const restore = {
      pending$,
      consume,
      queue: (): void => undefined,
    } as unknown as HistoryRestoreRequest;
    const reloadHistory = jasmine.createSpy('reloadHistory').and.returnValue(of(undefined));
    const task = { reloadHistory } as unknown as Task;
    const attemptId$ = new BehaviorSubject<string | undefined>('0');
    const loadedTask$ = new Subject<Task>();

    listenForHistoryRestore(restore, loadedTask$, attemptId$, destroyRef);

    pending$.next({ elementId: 3, attemptId: '0' });
    loadedTask$.next(task);

    expect(reloadHistory).toHaveBeenCalledWith({ elementId: 3 });
    expect(consume).toHaveBeenCalled();
  });
});
