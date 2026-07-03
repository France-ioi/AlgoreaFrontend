import { effect, inject, Injectable, OnDestroy } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { createSelector, Store } from '@ngrx/store';
import { EMPTY, fromEvent, merge, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  mergeWith,
  shareReplay,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { LocaleService } from 'src/app/services/localeService';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';
import { itemRouteAsUrlCommand } from '../models/routing/item-route-serialization';
import { RawItemRoute, routeWithSelfAttempt } from 'src/app/models/routing/item-route';
import { isATask } from 'src/app/items/models/item-type';
import { FetchState, readyState } from 'src/app/utils/state';
import { readyData } from 'src/app/utils/operators/state';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { ItemData } from './models/item-data';
import { InitialAnswerDataSource } from './services/initial-answer-datasource';
import { TaskConfig } from './services/item-task.service';
import { fromItemContent } from './store';

export const selectState = createSelector(
  fromItemContent.selectActiveContentRouteErrorHandlingState,
  fromItemContent.selectActiveContentData,
  (routeErrorHandlingState, itemData) => (routeErrorHandlingState === null ? itemData : routeErrorHandlingState)
);

@Injectable()
export class ItemTaskFlowService implements OnDestroy {
  private store = inject(Store);
  private localeService = inject(LocaleService);
  private confirmationModalService = inject(ConfirmationModalService);
  private itemRouter = inject(ItemRouter);
  private initialAnswerDataSource = inject(InitialAnswerDataSource);
  private config = inject(APPCONFIG);

  private itemRoute$ = this.store.select(fromItemContent.selectActiveContentRoute).pipe(filter(isNotNull));
  private itemDataState = this.store.selectSignal(fromItemContent.selectActiveContentData);
  private activeContentRoute = toSignal(this.itemRoute$);

  private saveHandler: () => Observable<FetchState<void>> = () => of(readyState<void>(undefined));
  private hadPopulatedItemState = false;

  private readonly state$ = this.store.select(selectState).pipe(filter(isNotNull)) as Observable<FetchState<ItemData>>;

  // Any value emitted in skipBeforeUnload$ resumes navigation WITHOUT cancelling the save request.
  private skipBeforeUnload$ = new Subject<void>();
  private retryBeforeUnload$ = new Subject<void>();
  private beforeUnload$ = new Subject<void>();
  private saveBeforeUnload$ = merge(this.beforeUnload$, this.retryBeforeUnload$).pipe(
    switchMap(() => this.saveHandler()),
    takeUntil(this.skipBeforeUnload$),
    mergeWith(this.skipBeforeUnload$.pipe(map(() => readyState<void>(undefined)))),
    shareReplay(1),
  );

  readonly taskConfig$: Observable<TaskConfig|null> = this.state$.pipe(
    readyData(),
    map(data => ({ isTask: isATask(data.item), route: data.route })),
    distinctUntilChanged((x, y) => JSON.stringify(x.route) === JSON.stringify(y.route)),
    switchMap(({ isTask, route }) => {
      if (!isTask) return of(null);
      const userLocale = this.localeService.currentLang?.tag;
      if (!userLocale) throw new Error('unexpected: locale not defined');
      return this.initialAnswerDataSource.answer$.pipe(
        catchError(() => EMPTY),
        map(initialAnswer => ({
          readOnly: !!route.answer,
          initialAnswer,
          locale: userLocale,
        }))
      );
    }),
  );

  // When navigating elsewhere but the current answer is unsaved, navigation is blocked until the save is performed.
  // savingAnswer$ indicates the loading state while blocking navigation because of the save request.
  readonly savingAnswer$ = this.saveBeforeUnload$.pipe(map(state => state.isFetching));

  readonly answerLoadingError$ = this.initialAnswerDataSource.error$.pipe(
    switchMap(answerErr => this.itemRoute$.pipe(
      map((route, idx) => (idx === 0 && answerErr !== undefined ? {
        isForbidden: errorIsHTTPForbidden(answerErr.error),
        fallbackLink: route.answer ? itemRouteAsUrlCommand({ ...route, answer: undefined }, this.config.redirects) : undefined,
      } : undefined /* reset error if we navigate */)))
    ),
  );

  constructor() {
    effect(() => {
      this.applyInitialAnswerInfoSync();
    });

    fromEvent<BeforeUnloadEvent>(globalThis, 'beforeunload', { capture: true })
      .pipe(
        switchMap(() => this.saveHandler()),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe({
        error: () => { /* Errors cannot be handled before unloading page. */ },
      });

    this.saveBeforeUnload$.pipe(
      map(state => state.isError),
      filter(isError => isError),
      switchMap(() => this.confirmationModalService.open({
        title: $localize`Leave unsaved task`,
        message: $localize`You do not appear to be connected to the Internet, if you leave this task you may loose your progress.
          Are you sure you want to continue?`,
        acceptButtonCaption: $localize`Loose progress and leave the task`,
        acceptButtonStyleClass: 'danger',
        rejectButtonCaption: $localize`Retry`,
        rejectButtonStyleClass: 'primary',
        allowToClose: false,
      }, { maxWidth: '34rem', disableClose: true }))
    ).pipe(takeUntilDestroyed()).subscribe(confirmed => {
      if (confirmed) {
        this.skipBeforeUnload();
      } else {
        this.retryBeforeUnload();
      }
    });
  }

  /**
   * Wires the save callback from the component's view child. Until registered, the default handler
   * returns a ready state so navigation is not blocked when no task display is mounted yet.
   */
  registerSaveHandler(fn: () => Observable<FetchState<void>>): void {
    this.saveHandler = fn;
  }

  beforeUnload(): Observable<boolean> {
    this.beforeUnload$.next();
    return this.saveBeforeUnload$.pipe(
      map(state => state.isReady),
      filter(done => done),
      take(1),
    );
  }

  retryBeforeUnload(): void {
    this.retryBeforeUnload$.next();
  }

  skipBeforeUnload(): void {
    this.skipBeforeUnload$.next();
  }

  setTaskView(view: string, route: RawItemRoute): void {
    // Navigating updates the URL, which drives the active tab (task tabs use exact, unique `task/<view>` routes).
    this.itemRouter.navigateTo(route, { page: [ 'task', view ], useCurrentObservation: true });
  }

  ngOnDestroy(): void {
    this.skipBeforeUnload$.complete();
    this.retryBeforeUnload$.complete();
    this.beforeUnload$.complete();
  }

  private applyInitialAnswerInfoSync(): void {
    const route = this.activeContentRoute();
    const itemState = this.itemDataState();
    if (!route) return;

    if (itemState === null) {
      if (this.hadPopulatedItemState) return;
      this.initialAnswerDataSource.setInfo(route, undefined);
      return;
    }

    this.hadPopulatedItemState = true;
    if (route.id === itemState.data?.item.id) {
      this.initialAnswerDataSource.setInfo(
        routeWithSelfAttempt(itemState.data.route, itemState.data.currentResult?.attemptId),
        isATask(itemState.data.item),
      );
    } else {
      this.initialAnswerDataSource.setInfo(route, undefined);
    }
  }
}
