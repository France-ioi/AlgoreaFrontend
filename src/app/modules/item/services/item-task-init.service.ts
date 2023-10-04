import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, fromEvent, merge, Observable, of, ReplaySubject, Subject, TimeoutError } from 'rxjs';
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
  timeout,
} from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { Task, taskProxyFromIframe, taskUrlWithParameters } from '../task-communication/task-proxy';
import { Answer } from './item-task.service';

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
  private destroyed$ = new Subject<void>();
  private configFromItem$ = new ReplaySubject<ItemTaskConfig>(1);
  private configFromIframe$ = new ReplaySubject<{ iframe: HTMLIFrameElement, bindPlatform(task: Task): void }>(1);

  readonly config$ = this.configFromItem$.asObservable();
  readonly iframe$ = this.configFromIframe$.pipe(map(config => config.iframe));

  readonly iframeSrc$ = this.config$.pipe(
    distinctUntilChanged((c1, c2) => c1.url === c2.url && c1.locale === c2.locale),
    map(({ url, locale }) => taskUrlWithParameters(this.checkUrl(url), appConfig.itemPlatformId, taskChannelIdPrefix, locale)),
    shareReplay(1), // avoid duplicate xhr calls
  );

  readonly taskLoading$ = this.configFromIframe$.pipe(
    delayWhen(({ iframe }) => fromEvent(iframe, 'load')), // triggered for good & bad url, not for not responding servers
    switchMap(({ iframe, bindPlatform }) => taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        bindPlatform(task);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return merge(
          task.load(initialViews).pipe(map(() => ({ task, loaded: true }))),
          of({ task, loaded: false }), // will be emitted immediately after `task.load` has been called (possibly not answered yet)
        );
      }),
    )),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  readonly task$ = this.taskLoading$.pipe(
    filter(({ loaded }) => loaded),
    map(({ task }) => task),
  );

  readonly initError$ = this.configFromIframe$.pipe(switchMap(({ iframe }) => fromEvent(iframe, 'load'))).pipe(
    switchMap(() => this.task$),
    timeout({ first: loadTaskTimeout }), // after the iframe has loaded, if no connection to jschannel is made, consider the task broken
    catchError(timeoutError => of(timeoutError)),
    filter(error => error instanceof TimeoutError),
  ) as Observable<TimeoutError>;
  readonly urlError$ = this.iframeSrc$.pipe(
    catchError((urlError: Error) => of(urlError)),
    filter(error => error instanceof Error),
  ) as Observable<Error>;

  initialized = false;

  /** Guard: throw exception if the config changes, except `initialAnswer` and `attemptId` */
  subscription = this.config$.pipe(pairwise()).subscribe(([ prev, cur ]) => {
    if (
      prev.readOnly !== cur.readOnly ||
      prev.locale !== cur.locale ||
      prev.route !== cur.route ||
      prev.url !== cur.url
    ) throw new Error('cannot change task config, except for initialAnswer');
  });

  ngOnDestroy(): void {
    // task is a one replayed value observable. If a task has been emitted, destroy it ; else nothing to do.
    this.task$.pipe(timeout(0), catchError(() => EMPTY)).subscribe(task => task.destroy());
    if (!this.configFromItem$.closed) this.configFromItem$.complete();
    if (!this.configFromIframe$.closed) this.configFromIframe$.complete();
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
