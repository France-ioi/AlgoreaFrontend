import { Injectable, OnDestroy, inject } from '@angular/core';
import { EMPTY, fromEvent, Observable, of, ReplaySubject, Subject, TimeoutError } from 'rxjs';
import {
  catchError,
  delayWhen,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
  timeout,
} from 'rxjs/operators';
import { APPCONFIG } from 'src/app/app.config';
import { SECONDS } from 'src/app/utils/duration';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { Task, taskProxyFromIframe, taskUrlWithParameters } from '../api/task-proxy';
import { Answer } from './item-task.service';
import { TaskToken, TaskTokenService } from '../data-access/task-token.service';

const taskChannelIdPrefix = 'task-';
const loadTaskTimeout = 15 * SECONDS;

export interface ItemTaskConfig {
  route: FullItemRoute,
  url: string,
  attemptId?: string,
  initialAnswer: Answer | undefined /* not defined yet */ | null /* no initial answer */,
  readOnly: boolean,
  locale?: string,
}

@Injectable()
export class ItemTaskInitService implements OnDestroy {
  private config = inject(APPCONFIG);
  private destroyed$ = new Subject<void>();
  private configFromItem$ = new ReplaySubject<ItemTaskConfig>(1);
  private configFromIframe$ = new ReplaySubject<{ iframe: HTMLIFrameElement, bindPlatform(task: Task): void }>(1);

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
    // eslint-disable-next-line @typescript-eslint/unbound-method
    switchMap(({ iframe, bindPlatform }) => taskProxyFromIframe(iframe).pipe(tap(task => bindPlatform(task)))),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  // task token generation (possibly after some delay) (may fail!)
  readonly taskToken$: Observable<TaskToken> = this.config$.pipe(
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
    switchMap(s => {
      if (s.strategy === 'answerToken') return this.taskTokenService.generateForAnswer(s.answerId);
      if (s.strategy === 'regularToken') return this.taskTokenService.generate(s.itemId, s.attemptId);
      return EMPTY; // s.strategy === 'wait'
    }),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  // the task (i.e., a client to the task in the iframe) which has been loaded (may fail!)
  readonly loadedTask$ = this.task$.pipe(
    switchMap(task => task.getMetaData().pipe(map(({ usesTokens }) => ({ usesTokens: usesTokens ?? true, task })))),
    switchMap(({ usesTokens, task }) => (usesTokens ? this.taskToken$.pipe(
      switchMap(token => task.updateToken(token)),
      map(() => task)
    ): of(task))),
    switchMap(task => task.load(
      { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true }
    ).pipe(map(() => task))),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  readonly initError$ = this.configFromIframe$.pipe(switchMap(({ iframe }) => fromEvent(iframe, 'load'))).pipe(
    switchMap(() => this.loadedTask$),
    timeout({ first: loadTaskTimeout }), // after the iframe has loaded, if no connection to jschannel is made, consider the task broken
    catchError(timeoutError => of(timeoutError)),
    filter(error => error instanceof TimeoutError),
  ) as Observable<TimeoutError>;
  readonly urlError$ = this.iframeSrc$.pipe(
    catchError((urlError: Error) => of(urlError)),
    filter(error => error instanceof Error),
  );

  initialized = false;

  /** Guard: throw exception if the config changes, except `initialAnswer` and `attemptId` */
  guardSubscription = this.config$.pipe(pairwise()).subscribe(([ prev, cur ]) => {
    if (prev.readOnly !== cur.readOnly) throw new Error(`cannot change task config (readonly prev:${prev.readOnly} cur:${cur.readOnly})`);
    if (prev.locale !== cur.locale) throw new Error(`cannot change task config (locale prev:${prev.locale} cur:${cur.locale})`);
    if (prev.route !== cur.route) {
      throw new Error(`cannot change task config (route prev:${JSON.stringify(prev.route)} cur:${JSON.stringify(cur.route)})`);
    }
    if (prev.url !== cur.url) throw new Error(`cannot change task config (url prev:${prev.url} cur:${cur.url})`);
  });

  // subscribe to the task token so that it is requested even before it is needed (so ready more quickly)
  tokenSubscription = this.taskToken$.pipe(catchError(() => EMPTY)).subscribe();

  constructor(
    private taskTokenService: TaskTokenService,
  ) {}

  ngOnDestroy(): void {
    // task is a one replayed value observable. If a task has been emitted, destroy it ; else nothing to do.
    this.task$.pipe(timeout(0), catchError(() => EMPTY)).subscribe(task => task.destroy());
    if (!this.configFromItem$.closed) this.configFromItem$.complete();
    if (!this.configFromIframe$.closed) this.configFromIframe$.complete();
    this.guardSubscription.unsubscribe();
    this.tokenSubscription.unsubscribe();
    this.destroyed$.next();
    this.destroyed$.complete();
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
    } catch (error) {
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
