import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { switchMap, map, distinctUntilChanged, filter, withLatestFrom } from 'rxjs';
import { ThreadService } from 'src/app/data-access/thread.service';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { forumThreadListActions, itemPageActions, threadPanelActions } from './current-thread.actions';
import { areSameThreads } from '../../models/threads';
import { Store } from '@ngrx/store';
import forum from '..';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';

export const fetchThreadInfoEffect = createEffect(
  (
    actions$ = inject(Actions),
    threadHttpService = inject(ThreadService),
  ) => actions$.pipe(
    ofType(forumThreadListActions.showAsCurrentThread, itemPageActions.currentThreadIdChange),
    map(({ id }) => id),
    distinctUntilChanged(areSameThreads),
    switchMap(({ itemId, participantId }) => threadHttpService.get(itemId, participantId).pipe(
      mapToFetchState(),
    )),
    map(fetchState => fetchThreadInfoActions.fetchStateChange({ fetchState }))
  ),
  { functional: true }
);

export const refreshThreadInfoEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    threadHttpService = inject(ThreadService),
  ) => actions$.pipe(
    ofType(threadPanelActions.threadStatusChanged),
    withLatestFrom(store$.select(forum.selectThreadId)),
    map(([ , threadId ]) => threadId),
    filter(isNotNull),
    switchMap(({ itemId, participantId }) => threadHttpService.get(itemId, participantId).pipe(
      mapToFetchState(),
    )),
    map(fetchState => fetchThreadInfoActions.fetchStateChange({ fetchState }))
  ),
  { functional: true }
);


