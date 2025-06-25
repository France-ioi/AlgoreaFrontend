import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { switchMap, map, distinctUntilChanged, filter, withLatestFrom, EMPTY } from 'rxjs';
import { ThreadService } from 'src/app/data-access/thread.service';
import { fetchThreadInfoActions } from './fetchThreadInfo.actions';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { forumThreadListActions, itemPageActions, threadPanelActions } from './current-thread.actions';
import { areSameThreads } from '../../models/threads';
import { Store } from '@ngrx/store';
import { fromForum } from '..';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { APPCONFIG } from 'src/app/config';

export const fetchThreadInfoEffect = createEffect(
  (
    actions$ = inject(Actions),
    threadHttpService = inject(ThreadService),
    config = inject(APPCONFIG),
  ) => (config.forumServerUrl ? actions$.pipe(
    ofType(forumThreadListActions.showAsCurrentThread, itemPageActions.changeCurrentThreadId),
    map(({ id }) => id),
    distinctUntilChanged(areSameThreads),
    switchMap(({ itemId, participantId }) => threadHttpService.get(itemId, participantId).pipe(
      mapToFetchState(),
    )),
    map(fetchState => fetchThreadInfoActions.fetchStateChanged({ fetchState }))
  ) : EMPTY),
  { functional: true }
);

export const refreshThreadInfoEffect = createEffect(
  (
    actions$ = inject(Actions),
    store$ = inject(Store),
    threadHttpService = inject(ThreadService),
    config = inject(APPCONFIG),
  ) => (config.forumServerUrl ? actions$.pipe(
    ofType(threadPanelActions.threadStatusChanged),
    withLatestFrom(store$.select(fromForum.selectThreadId)),
    map(([ , threadId ]) => threadId),
    filter(isNotNull),
    switchMap(({ itemId, participantId }) => threadHttpService.get(itemId, participantId).pipe(
      mapToFetchState(),
    )),
    map(fetchState => fetchThreadInfoActions.fetchStateChanged({ fetchState }))
  ) : EMPTY),
  { functional: true }
);


