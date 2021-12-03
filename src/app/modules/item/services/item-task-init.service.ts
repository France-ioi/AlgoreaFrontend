import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Observable, of, ReplaySubject, TimeoutError } from 'rxjs';
import { catchError, delayWhen, distinctUntilChanged, filter, map, mapTo, shareReplay, startWith, switchMap, timeout, withLatestFrom } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { Answer } from '../http-services/get-answer.service';
import { TaskTokenService, TaskToken } from '../http-services/task-token.service';
import { Task, taskProxyFromIframe, taskUrlWithParameters } from '../task-communication/task-proxy';

const taskChannelIdPrefix = 'task-';
const loadTaskTimeout = 15 * SECONDS;

export interface ItemTaskConfig {
  route: FullItemRoute,
  url: string,
  attemptId: string,
  formerAnswer: Answer | null,
  readOnly: boolean,
}

@Injectable()
export class ItemTaskInitService implements OnDestroy {
  private configFromItem$ = new ReplaySubject<ItemTaskConfig>(1);
  private configFromIframe$ = new ReplaySubject<{ iframe: HTMLIFrameElement, bindPlatform(task: Task): void }>(1);
  private task = new ReplaySubject<Task>(1);
  readonly task$ = this.task.asObservable();

  readonly config$ = this.configFromItem$.asObservable();
  readonly iframe$ = this.configFromIframe$.pipe(map(config => config.iframe));
  readonly taskToken$: Observable<TaskToken> = this.config$.pipe(
    distinctUntilChanged((a, b) => a.route.id === b.route.id && a.attemptId === b.attemptId),
    switchMap(({ attemptId, route }) => this.taskTokenService.generate(route.id, attemptId)),
    shareReplay(1),
  );

  readonly iframeSrc$ = this.taskToken$.pipe(
    withLatestFrom(this.config$),
    map(([ taskToken, { url }]) => taskUrlWithParameters(this.checkUrl(url), taskToken, appConfig.itemPlatformId, taskChannelIdPrefix)),
    shareReplay(1), // avoid duplicate xhr calls
  );

  private subscription = this.configFromIframe$.pipe(
    delayWhen(({ iframe }) => fromEvent(iframe, 'load')), // triggered for good & bad url, not for not responding servers
    withLatestFrom(this.task$.pipe(startWith(undefined))),
    switchMap(([{ iframe, bindPlatform }, previousTask ]) => {
      if (previousTask) previousTask.destroy();
      return taskProxyFromIframe(iframe).pipe(
        switchMap(task => {
          bindPlatform(task);
          const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
          return task.load(initialViews).pipe(mapTo(task));
        }),
        timeout(loadTaskTimeout), // after the iframe has loaded, if no connection to jschannel is made, consider the task broken
      );
    }),
    shareReplay(1),
  ).subscribe(task => this.task.next(task));

  readonly initError$ = this.task$.pipe(
    catchError(timeoutError => of(timeoutError)),
    filter(error => error instanceof TimeoutError),
  ) as Observable<TimeoutError>;
  readonly urlError$ = this.iframeSrc$.pipe(
    catchError((urlError: Error) => of(urlError)),
    filter(error => error instanceof Error),
  ) as Observable<Error>;

  initialized = false;

  constructor(
    private taskTokenService: TaskTokenService,
  ) {}

  ngOnDestroy(): void {
    // task is a one replayed value observable. If a task has been emitted, destroy it ; else nothing to do.
    this.task$.pipe(timeout(0)).subscribe(task => task.destroy());
    this.configFromItem$.complete();
    this.subscription.unsubscribe();
    if (!this.configFromIframe$.closed) this.configFromIframe$.complete();
    console.log('[ItemTaskInit] destroy');
  }

  configure(route: FullItemRoute, url: string, attemptId: string, formerAnswer: Answer | null, readOnly = false): void {
    console.log('[ItemTaskInit] configure', { route, formerAnswer, readOnly });
    // if (this.configured) throw new Error('task init service can be configured once only');
    // this.configured = true;
    this.configFromItem$.next({ route, url, attemptId, formerAnswer, readOnly });
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

    if (!url.startsWith('http')) throw new Error($localize`Invalid url "${url}": please provide an http link`);

    // Avoid mixed-content error: https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content/How_to_fix_website_with_mixed_content
    // mixed-content is when an https website tries to load an http content, ie: iframe.src, script.src, etc.
    const isMixedContent = globalThis.location.protocol === 'https:' && url.startsWith('http:');
    if (isMixedContent) throw new Error($localize`Invalid url, please provide a secure task url (https)`);
    return url;
  }
}
