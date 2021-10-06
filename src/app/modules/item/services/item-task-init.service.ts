import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Observable, of, ReplaySubject, TimeoutError } from 'rxjs';
import { catchError, delayWhen, filter, map, mapTo, shareReplay, switchMap, timeout, withLatestFrom } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { SECONDS } from 'src/app/shared/helpers/duration';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { TaskTokenService, TaskToken } from '../http-services/task-token.service';
import { Task, taskProxyFromIframe, taskUrlWithParameters } from '../task-communication/task-proxy';

const taskChannelIdPrefix = 'task-';

export interface ItemTaskConfig {
  route: FullItemRoute,
  url: string,
  attemptId: string,
}

@Injectable()
export class ItemTaskInitService implements OnDestroy {
  private configFromItem$ = new ReplaySubject<ItemTaskConfig>(1);
  private configFromIframe$ = new ReplaySubject<{ iframe: HTMLIFrameElement, bindPlatform(task: Task): void }>(1);

  readonly config$ = this.configFromItem$.asObservable();
  readonly taskToken$: Observable<TaskToken> = this.config$.pipe(
    switchMap(({ attemptId, route }) => this.taskTokenService.generate(route.id, attemptId)),
    shareReplay(1),
  );

  readonly iframeSrc$ = this.taskToken$.pipe(
    withLatestFrom(this.config$),
    map(([ taskToken, { url }]) => taskUrlWithParameters(url, taskToken, appConfig.itemPlatformId, taskChannelIdPrefix)),
    map(url => this.checkUrlProtocol(url)),
    shareReplay(1), // avoid duplicate xhr calls
  );

  readonly task$ = this.configFromIframe$.pipe(
    delayWhen(({ iframe }) => fromEvent(iframe, 'load')), // triggered for good & bad url, not for not responding servers
    switchMap(({ iframe, bindPlatform }) => taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        bindPlatform(task);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return task.load(initialViews).pipe(mapTo(task));
      }),
      timeout(15 * SECONDS), // after the iframe has loaded, if no connection to jschannel is made, consider the task broken
    )),
    shareReplay(1),
  );

  readonly initError$ = this.task$.pipe(
    catchError(timeoutError => of(timeoutError)),
    filter(error => error instanceof TimeoutError),
  );
  readonly urlError$ = this.iframeSrc$.pipe(
    catchError((urlError: Error) => of(urlError)),
    filter(error => error instanceof Error),
  ) as Observable<Error>;

  initialized = false;
  configured = false;

  constructor(
    private taskTokenService: TaskTokenService,
  ) {}

  ngOnDestroy(): void {
    // task is a one replayed value observable. If a task has been emitted, destroy it ; else nothing to do.
    this.task$.pipe(timeout(0)).subscribe(task => task.destroy());
    if (!this.configFromItem$.closed) this.configFromItem$.complete();
    if (!this.configFromIframe$.closed) this.configFromIframe$.complete();
  }

  configure(route: FullItemRoute, url: string, attemptId: string): void {
    if (this.configured) throw new Error('task init service can be configured once only');
    this.configured = true;

    this.configFromItem$.next({ route, url, attemptId });
    this.configFromItem$.complete();
  }

  initTask(iframe: HTMLIFrameElement, bindPlatform: (task: Task) => void): void {
    if (this.initialized) throw new Error('task init service can be initialized once only');
    this.initialized = true;
    this.configFromIframe$.next({ iframe, bindPlatform });
    this.configFromIframe$.complete();
  }

  private checkUrlProtocol(url: string): string {
    // Avoid mixed-content error: https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content/How_to_fix_website_with_mixed_content
    // mixed-content is when an https website tries to load an http content, ie: iframe.src, script.src, etc.
    const isMixedContent = globalThis.location.protocol === 'https:' && url.startsWith('http:');
    if (isMixedContent) throw new Error($localize`Invalid url, please provide a secure task url (https)`);
    return url;
  }
}
