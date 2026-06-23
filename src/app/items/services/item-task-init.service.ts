import { DestroyRef, Injectable, InjectionToken, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, fromEvent, merge, Observable, of, ReplaySubject, Subject, TimeoutError } from 'rxjs';
import {
  catchError,
  delayWhen,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  retry,
  shareReplay,
  skip,
  switchMap,
  take,
  tap,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { SECONDS } from 'src/app/utils/duration';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import equal from 'fast-deep-equal/es6';
import { Task, negotiateApiVersion, taskProxyFromIframe, taskUrlWithParameters } from '../api/task-proxy';
import { Answer } from './item-task.service';
import { TaskToken, TaskTokenService } from '../data-access/task-token.service';

const taskChannelIdPrefix = 'task-';
export const LOAD_TASK_TIMEOUT = new InjectionToken<number>('loadTaskTimeout', {
  factory: (): number => 20 * SECONDS,
});

type TaskProxyFactory = (iframe: HTMLIFrameElement) => Observable<Task>;
export const TASK_PROXY_FROM_IFRAME = new InjectionToken<TaskProxyFactory>('taskProxyFromIframe', {
  factory: (): TaskProxyFactory => taskProxyFromIframe,
});

export interface ItemTaskConfig {
  route: FullItemRoute,
  url: string,
  attemptId?: string,
  initialAnswer: Answer | undefined /* not defined yet */ | null /* no initial answer */,
  readOnly: boolean,
  locale?: string,
}

export class IncompatibleTaskApiVersionError extends Error {
  constructor() {
    super($localize`:@@incompatibleTaskApiVersionError:This task requires an unsupported version of the platform API.`);
    this.name = 'IncompatibleTaskApiVersionError';
  }
}

@Injectable()
export class ItemTaskInitService implements OnDestroy {
  private taskTokenService = inject(TaskTokenService);

  private config = inject(APPCONFIG);
  private loadTaskTimeout = inject(LOAD_TASK_TIMEOUT);
  private taskProxyFromIframe = inject(TASK_PROXY_FROM_IFRAME);
  private destroyRef = inject(DestroyRef);
  private configFromItem$ = new ReplaySubject<ItemTaskConfig>(1);
  private configFromIframe$ = new ReplaySubject<{ iframe: HTMLIFrameElement, bindPlatform(task: Task): void }>(1);
  // forces `taskToken$` to re-generate a token even when the generation strategy is unchanged (e.g. after a validating
  // grade, so that the new token grants solution access)
  private refreshToken$ = new Subject<void>();

  readonly config$ = this.configFromItem$.asObservable();
  readonly iframe$ = this.configFromIframe$.pipe(map(config => config.iframe));

  readonly iframeSrc$ = this.config$.pipe(
    distinctUntilChanged((c1, c2) => c1.url === c2.url && c1.locale === c2.locale),
    map(({ url, locale }) => taskUrlWithParameters(this.checkUrl(url), this.config.itemPlatformId, taskChannelIdPrefix, locale)),
    shareReplay(1), // avoid duplicate xhr calls
  );

  // the task (i.e., a client to the task in the iframe), for which the iframe has been loaded but the "load()" function may have not been
  // called yet.
  readonly task$ = this.configFromIframe$.pipe(
    delayWhen(({ iframe }) => fromEvent(iframe, 'load')), // triggered for good & bad url, not for not responding servers
    switchMap(config => this.taskProxyFromIframe(config.iframe).pipe(tap(task => config.bindPlatform(task)))),
    takeUntilDestroyed(this.destroyRef),
    shareReplay(1),
  );

  // generation strategy, recomputed on config changes only
  private tokenStrategy$ = this.config$.pipe(
    // build strategy separately from switchMap to prevent cancellation of the request
    map(({ readOnly, initialAnswer, attemptId, route }) => {
      if (readOnly) {
        // if readonly -> if initialAnswer is still unknown, wait the next config update to generate token
        if (initialAnswer === undefined) return { strategy: 'wait' as const };
        // if readonly -> if there is an initial answer,
        if (initialAnswer !== null) return { strategy: 'answerToken' as const, answerId: initialAnswer.id };
      }
      // if the attempt id is not known yet: wait
      if (attemptId === undefined) return { strategy: 'wait' as const };
      // if we are editing (= not in readOnly) -> we need a token for our user
      // if there are no answer loaded -> we currently want an empty task, so using our own task token
      return { strategy: 'regularToken' as const, itemId: route.id, attemptId };
    }),
    distinctUntilChanged((prev, cur) => prev.strategy === cur.strategy),
  );

  // task token generation (possibly after some delay) (may fail!)
  // re-emits a freshly generated token whenever the strategy changes or `refreshToken()` is called. Each emission is
  // tagged with whether it was triggered by a refresh (vs a strategy change) so that ONLY refresh-triggered generations
  // swallow errors — using which source emitted (not a sticky combineLatest flag), so a strategy change after a refresh
  // still propagates its errors.
  readonly taskToken$: Observable<TaskToken> = merge(
    this.tokenStrategy$.pipe(map(strategy => ({ strategy, isRefresh: false }))),
    this.refreshToken$.pipe(withLatestFrom(this.tokenStrategy$), map(([ , strategy ]) => ({ strategy, isRefresh: true }))),
  ).pipe(
    switchMap(({ strategy: s, isRefresh }) => {
      let generate$: Observable<TaskToken> = EMPTY; // s.strategy === 'wait'
      if (s.strategy === 'answerToken') generate$ = this.taskTokenService.generateForAnswer(s.answerId);
      if (s.strategy === 'regularToken') generate$ = this.taskTokenService.generate(s.itemId, s.attemptId);
      // A refresh failure must NOT error `taskToken$`: it is a shared stream also consumed by `submitAnswer()`
      // (answer-token + save-grade), so erroring it would break every later submission. Keep the previous token
      // instead. Initial-load / strategy-change generation keeps propagating errors (handled by load timeout / consumers).
      return isRefresh ? generate$.pipe(retry(2), catchError(() => EMPTY)) : generate$;
    }),
    takeUntilDestroyed(this.destroyRef),
    shareReplay(1),
  );

  // the loaded task together with whether it consumes task tokens (kept internally so `tokenUpdatedOnTask$` can gate on
  // it without re-fetching the metadata). May fail!
  private loadedTaskWithTokenUse$ = this.task$.pipe(
    switchMap(task => task.getMetaData().pipe(map(metadata => {
      const negotiated = negotiateApiVersion(metadata.minApiVersion, metadata.apiVersion);
      if (negotiated === null) throw new IncompatibleTaskApiVersionError();
      task.apiVersion = negotiated;
      return { usesTokens: metadata.usesTokens ?? true, task };
    }))),
    switchMap(({ usesTokens, task }) => (usesTokens ? this.taskToken$.pipe(
      take(1), // only the first token is used to load the task; later tokens are pushed via `tokenUpdatedOnTask$`
      switchMap(token => task.updateToken(token)),
      map(() => ({ usesTokens, task })),
    ): of({ usesTokens, task }))),
    switchMap(({ usesTokens, task }) => task.load(
      { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true }
    ).pipe(map(() => ({ usesTokens, task })))),
    takeUntilDestroyed(this.destroyRef),
    shareReplay(1),
  );

  // the task (i.e., a client to the task in the iframe) which has been loaded (may fail!)
  // no shareReplay here: the source is already multicast+replayed; this is just a pure projection of it
  readonly loadedTask$ = this.loadedTaskWithTokenUse$.pipe(map(({ task }) => task));

  // pushes tokens generated after the initial load to the task (e.g. after a refresh), so the task can re-evaluate what
  // it is allowed to show (such as the solution view). Emits the task each time a new token has been applied.
  // No-op for token-less tasks: they ignore tokens and pushing one could error their (unimplemented) `updateToken`.
  readonly tokenUpdatedOnTask$: Observable<Task> = this.loadedTaskWithTokenUse$.pipe(
    // INVARIANT: `refreshToken()` is only ever called after the task is loaded (its single caller, submitAnswer(),
    // structurally requires a loaded task). This lets `skip(1)` reliably drop the load-time token replayed by
    // `taskToken$` (shareReplay(1)). If a future caller refreshes *before* load completes, that token would be the
    // value replayed here and `skip(1)` would silently discard the refresh — keep the invariant or revisit this.
    switchMap(({ usesTokens, task }) => (usesTokens ? this.taskToken$.pipe(
      skip(1), // skip the token already applied during load (token-less tasks never reach this branch)
      switchMap(token => task.updateToken(token).pipe(
        map(() => task),
        catchError(() => EMPTY), // a single failed push must not kill future view re-queries
      )),
    ) : EMPTY)),
    takeUntilDestroyed(this.destroyRef),
    shareReplay(1),
  );

  readonly initError$ = this.configFromIframe$.pipe(switchMap(({ iframe }) => fromEvent(iframe, 'load'))).pipe(
    switchMap(() => this.loadedTask$),
    // after the iframe has loaded, if no connection to jschannel is made, consider the task broken
    timeout({ first: this.loadTaskTimeout }),
    catchError(timeoutError => of(timeoutError)),
    filter(error => error instanceof TimeoutError),
  ) as Observable<TimeoutError>;
  readonly urlError$ = this.iframeSrc$.pipe(
    catchError((urlError: Error) => of(urlError)),
    filter(error => error instanceof Error),
  );
  readonly apiVersionError$ = this.configFromIframe$.pipe(
    switchMap(({ iframe }) => fromEvent(iframe, 'load')),
    switchMap(() => this.loadedTask$),
    catchError(err => of(err)),
    filter((err): err is IncompatibleTaskApiVersionError => err instanceof IncompatibleTaskApiVersionError),
  );

  initialized = false;

  /** Guard: throw exception if the config changes, except `initialAnswer` and `attemptId` */
  guardSubscription = this.config$.pipe(pairwise()).subscribe(([ prev, cur ]) => {
    if (prev.readOnly !== cur.readOnly) throw new Error(`cannot change task config (readonly prev:${prev.readOnly} cur:${cur.readOnly})`);
    if (prev.locale !== cur.locale) throw new Error(`cannot change task config (locale prev:${prev.locale} cur:${cur.locale})`);
    if (!equal(prev.route, cur.route)) {
      throw new Error(`cannot change task config (route prev:${JSON.stringify(prev.route)} cur:${JSON.stringify(cur.route)})`);
    }
    if (prev.url !== cur.url) throw new Error(`cannot change task config (url prev:${prev.url} cur:${cur.url})`);
  });

  // subscribe to the task token so that it is requested even before it is needed (so ready more quickly)
  tokenSubscription = this.taskToken$.pipe(catchError(() => EMPTY)).subscribe();
  // keep the token pushed to the task even if no other consumer subscribes to `tokenUpdatedOnTask$`
  tokenPushSubscription = this.tokenUpdatedOnTask$.pipe(catchError(() => EMPTY)).subscribe();

  ngOnDestroy(): void {
    // task is a one replayed value observable. If a task has been emitted, destroy it ; else nothing to do.
    this.task$.pipe(timeout(0), catchError(() => EMPTY)).subscribe(task => task.destroy());
    if (!this.configFromItem$.closed) this.configFromItem$.complete();
    if (!this.configFromIframe$.closed) this.configFromIframe$.complete();
    this.guardSubscription.unsubscribe();
    this.tokenSubscription.unsubscribe();
    this.tokenPushSubscription.unsubscribe();
    this.refreshToken$.complete();
  }

  /**
   * Request a fresh task token to be generated and pushed to the loaded task.
   * Useful after an event that changes the user's permissions on the task (e.g. validating it grants solution access).
   *
   * MUST be called only after the task has been loaded (see the `skip(1)` invariant on `tokenUpdatedOnTask$`): a refresh
   * triggered before load completes would be swallowed and silently lost.
   */
  refreshToken(): void {
    this.refreshToken$.next();
  }

  configure(
    route: FullItemRoute,
    url: string,
    attemptId: string | undefined,
    initialAnswer: Answer | undefined | null,
    locale?: string,
    readOnly = false
  ): void {
    this.configFromItem$.next({ route, url, attemptId, initialAnswer, locale, readOnly });
  }

  initTask(iframe: HTMLIFrameElement, bindPlatform: (task: Task) => void): void {
    if (this.initialized) throw new Error('task init service can be initialized once only');
    this.initialized = true;
    this.configFromIframe$.next({ iframe, bindPlatform });
    this.configFromIframe$.complete();
  }

  private checkUrl(url: string): string {
    try {
      new URL(url);
    } catch {
      throw new Error($localize`Maformed url: "${url}"`);
    }

    if (!url.startsWith('http')) throw new Error($localize`Invalid url "${url}": please provide an http(s) link`);

    // Avoid mixed-content error: https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content/How_to_fix_website_with_mixed_content
    // mixed-content is when an https website tries to load an http content, ie: iframe.src, script.src, etc.
    const isMixedContent = globalThis.location.protocol === 'https:' && url.startsWith('http:');
    if (isMixedContent) throw new Error($localize`Invalid url, please provide a secure task url (https)`);
    return url;
  }
}
