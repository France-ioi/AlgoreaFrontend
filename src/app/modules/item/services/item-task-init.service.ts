import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Observable, ReplaySubject } from 'rxjs';
import { delayWhen, map, mapTo, shareReplay, switchMap, timeout, withLatestFrom } from 'rxjs/operators';
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
    shareReplay(1), // avoid duplicate xhr calls
  );

  readonly task$ = this.configFromIframe$.pipe(
    delayWhen(({ iframe }) => fromEvent(iframe, 'load')),
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
}
