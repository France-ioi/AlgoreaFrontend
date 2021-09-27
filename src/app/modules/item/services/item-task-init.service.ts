import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, ReplaySubject } from 'rxjs';
import { map, mapTo, shareReplay, switchMap, timeout, withLatestFrom } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { GenerateTaskTokenService, TaskToken } from '../http-services/generate-task-token.service';
import { Task, taskProxyFromIframe, taskUrlWithParameters } from '../task-communication/task-proxy';

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
    switchMap(({ attemptId, route }) => this.generateTaskTokenService.generate(route.id, attemptId)),
    shareReplay(1),
  );
  readonly iframeSrc$ = this.taskToken$.pipe(
    withLatestFrom(this.config$),
    map(([ taskToken, { url }]) => taskUrlWithParameters(url, taskToken, appConfig.itemPlatformId, 'task-')),
    map(urlWithParams => this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams)),
  );

  readonly task$ = this.configFromIframe$.pipe(
    switchMap(({ iframe, bindPlatform }) => taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        bindPlatform(task);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return task.load(initialViews).pipe(mapTo(task));
      })),
    ),
    shareReplay(1),
  );

  get initialized(): boolean {
    return this.configFromIframe$.closed;
  }

  constructor(
    private sanitizer: DomSanitizer,
    private generateTaskTokenService: GenerateTaskTokenService,
  ) {}

  ngOnDestroy(): void {
    // task is a one replayed value observable. If a task has been emitted, destroy it ; else nothing to do.
    this.task$.pipe(timeout(0)).subscribe(task => task.destroy());
    if (!this.configFromItem$.closed) this.configFromItem$.complete();
    if (!this.configFromIframe$.closed) this.configFromIframe$.complete();
  }

  configure(route: FullItemRoute, url?: string, attemptId?: string): void {
    if (this.configFromItem$.closed) return;

    if (!url) return this.setError(new Error('No URL defined for this task'));
    if (!attemptId) return this.setError(new Error('an attempt id is required to retrieve task token'));
    this.configFromItem$.next({ route, url, attemptId });
    this.configFromItem$.complete();
  }

  initTask(iframe: HTMLIFrameElement, bindPlatform: (task: Task) => void): void {
    if (this.configFromIframe$.closed) return;

    this.configFromIframe$.next({ iframe, bindPlatform });
    this.configFromIframe$.complete();
  }

  setError(error: unknown): void {
    if (!this.configFromItem$.closed) this.configFromItem$.error(error);
    if (!this.configFromIframe$.closed) this.configFromIframe$.error(error);
  }
}
