import { Injectable } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { map, mapTo, switchMap } from 'rxjs/operators';
import { ItemNavigationService } from 'src/app/core/http-services/item-navigation.service';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { Task, TaskPlatform } from '../task-communication/task-proxy';
import { TaskParamsValue } from '../task-communication/types';
import { ItemTaskAnswerService } from './item-task-answer.service';
import { ItemTaskInitService } from './item-task-init.service';
import { ItemTaskViewsService } from './item-task-views.service';

@Injectable()
export class ItemTaskService {
  task$ = this.initService.task$;
  iframeSrc$ = this.initService.iframeSrc$;
  get initialized(): boolean {
    return this.initService.initialized;
  }

  views$ = this.viewsService.views$;
  display$ = this.viewsService.display$;
  activeView$ = this.viewsService.activeView$;

  private config$ = this.initService.config$;

  constructor(
    private initService: ItemTaskInitService,
    private answerService: ItemTaskAnswerService,
    private viewsService: ItemTaskViewsService,
    private itemRouter: ItemRouter,
    private itemNavigationService: ItemNavigationService,
  ) {}

  configure(route: FullItemRoute, url?: string, attemptId?: string): void {
    this.initService.configure(route, url, attemptId);
  }

  initTask(iframe: HTMLIFrameElement): void {
    this.initService.initTask(iframe, task => this.bindPlatform(task));
  }

  showView(view: string): void {
    this.viewsService.showView(view);
  }

  private bindPlatform(task: Task): void {
    const platform = new TaskPlatform({
      validate: (mode): Observable<void> => this.validate(mode).pipe(mapTo(undefined)),
      getTaskParams: (): Observable<TaskParamsValue> =>
        of({ minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} }),
      updateDisplay: (display): Observable<void> => {
        this.viewsService.updateDisplay(display);
        return EMPTY;
      },
      showView: (view): Observable<void> => {
        this.viewsService.showView(view);
        return EMPTY;
      },
    });
    task.bindPlatform(platform);
  }

  private validate(mode: string): Observable<unknown> {
    switch (mode) {
      case 'cancel':
        return this.answerService.reloadAnswer();

      case 'validate':
      case 'done':
        return this.answerService.submitAnswer();

      case 'nextImmediate':
        return this.navigateToNextItem();

      default:
        // Other unimplemented modes
        return EMPTY;
    }
  }

  private navigateToNextItem(): Observable<void> {
    return this.config$.pipe(
      switchMap(({ route }) => this.itemNavigationService.getNavigationNeighbors(route)),
      map(data => {
        if (data.right) this.itemRouter.navigateTo(data.right);
      }),
    );
  }
}
