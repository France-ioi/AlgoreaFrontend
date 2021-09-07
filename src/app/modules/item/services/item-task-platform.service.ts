import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EMPTY, Observable, of, ReplaySubject, throwError } from 'rxjs';
import { catchError, map, mapTo, switchMap, take } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { GenerateTaskTokenService } from '../http-services/generate-task-token.service';
import { Item } from '../http-services/get-item-by-id.service';
import { Task, TaskPlatform, taskProxyFromIframe, taskUrlWithParameters } from '../task-communication/task-proxy';
import { TaskParamsKeyDefault, TaskParamsValue, UpdateDisplayParams } from '../task-communication/types';

@Injectable({
  providedIn: 'root',
})
export class ItemTaskPlatformService extends TaskPlatform implements OnDestroy {
  private displaySubject = new ReplaySubject<UpdateDisplayParams>(1);
  taskDisplay$ = this.displaySubject.asObservable();

  private taskSubject = new ReplaySubject<Task>(1);
  task$ = this.taskSubject.asObservable();

  private lastIframeLoaded?: HTMLIFrameElement;

  constructor(
    private sanitizer: DomSanitizer,
    private generateTaskTokenService: GenerateTaskTokenService,
  ) {
    super();
  }

  ngOnDestroy(): void {
    this.taskSubject.pipe(take(1)).subscribe(task => task.destroy());
    if (!this.taskSubject.closed) this.taskSubject.complete();
    this.displaySubject.complete();
  }

  getIframeSrcUrl(item: Item, attemptId: string): Observable<SafeResourceUrl> {
    if (!item.url) return throwError(new Error('no url for item'));

    const url = item.url;
    return this.generateTaskTokenService.generateToken(item.id, attemptId).pipe(
      map(taskToken => taskUrlWithParameters(url, taskToken, appConfig.itemPlatformId, 'task-')),
      map(iframeUrl => this.sanitizer.bypassSecurityTrustResourceUrl(iframeUrl)),
      catchError(err => {
        this.taskSubject.error(err);
        return EMPTY;
      })
    );
  }

  loadTaskFromIframe(iframe: HTMLIFrameElement): void {
    if (iframe === this.lastIframeLoaded) return;
    this.lastIframeLoaded = iframe;

    taskProxyFromIframe(iframe).pipe(
      switchMap(task => {
        // Got task proxy from the iframe, ask task to load
        task.bindPlatform(this);
        const initialViews = { task: true, solution: true, editor: true, hints: true, grader: true, metadata: true };
        return task.load(initialViews).pipe(mapTo(task));
      }),
    ).subscribe(this.taskSubject); // calling subscribe this way will also complete the subject and forward errors
  }

  /* override */ validate(mode: string): Observable<void> {
    if (mode == 'cancel') {
      // TODO reload answer
      return EMPTY;
    }

    if (mode == 'validate') {
      return this.task$.pipe(
        // so that switchMap interrupts request if state changes
        switchMap(task => task.getAnswer().pipe(map(answer => ({ task, answer })))),
        switchMap(({ task, answer }) => task.gradeAnswer(answer, '')),
        switchMap((_results: any) =>
          // TODO Do something with the results
          EMPTY
        )
      );
    }
    // Other unimplemented modes
    return EMPTY;
  }

  /* override */ updateDisplay(data: UpdateDisplayParams): Observable<void> {
    this.displaySubject.next(data);
    return EMPTY;
  }

  /* override */ getTaskParams(_keyDefault?: TaskParamsKeyDefault): Observable<TaskParamsValue> {
    const taskParams = { minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} };
    return of(taskParams);
  }
}
