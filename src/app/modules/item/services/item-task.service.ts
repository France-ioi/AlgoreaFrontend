import { Injectable } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { FullItemRoute } from 'src/app/shared/routing/item-route';
import { Task, TaskPlatform } from '../task-communication/task-proxy';
import { TaskParamsValue } from '../task-communication/types';
import { ItemTaskAnswerService } from './item-task-answer.service';
import { ItemTaskInitService } from './item-task-init.service';
import { ItemTaskViewsService } from './item-task-views.service';

@Injectable()
export class ItemTaskService {
  task$ = this.itemTaskInitService.task$;
  iframeSrc$ = this.itemTaskInitService.iframeSrc$;
  get initialized(): boolean {
    return this.itemTaskInitService.initialized;
  }

  views$ = this.itemTaskViewsService.views$;
  display$ = this.itemTaskViewsService.display$;
  activeView$ = this.itemTaskViewsService.activeView$;

  constructor(
    private itemTaskInitService: ItemTaskInitService,
    private itemTaskAnswerService: ItemTaskAnswerService,
    private itemTaskViewsService: ItemTaskViewsService,
  ) {}

  configure(route: FullItemRoute, url?: string, attemptId?: string): void {
    this.itemTaskInitService.configure(route, url, attemptId);
  }

  initTask(iframe: HTMLIFrameElement): void {
    this.itemTaskInitService.initTask(iframe, task => this.bindPlatform(task));
  }

  showView(view: string): void {
    this.itemTaskViewsService.showView(view);
  }

  private bindPlatform(task: Task): void {
    const platform = new TaskPlatform({
      validate: (mode): Observable<void> => this.itemTaskAnswerService.validate(mode),
      getTaskParams: (): Observable<TaskParamsValue> =>
        of({ minScore: -3, maxScore: 10, randomSeed: 0, noScore: 0, readOnly: false, options: {} }),
      updateDisplay: (display): Observable<void> => {
        this.itemTaskViewsService.updateDisplay(display);
        return EMPTY;
      },
      showView: (view): Observable<void> => {
        this.itemTaskViewsService.showView(view);
        return EMPTY;
      },
    });
    task.bindPlatform(platform);
  }
}
