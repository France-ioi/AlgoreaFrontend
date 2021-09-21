import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { animationFrames, EMPTY, Observable, of } from 'rxjs';
import { map, mapTo, switchMap, take } from 'rxjs/operators';
import { ItemNavigationService } from 'src/app/core/http-services/item-navigation.service';
import { LocaleService } from 'src/app/core/services/localeService';
import { FullItemRoute, itemRoute } from 'src/app/shared/routing/item-route';
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
    private router: Router,
    private localeService: LocaleService,
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
      openUrl: (params): Observable<void> => {
        if (typeof params === 'string') return this.navigateToItem(params);
        if ('path' in params) return this.navigateToItem(params.path, params.newTab);
        this.navigate(params.url, params.newTab);
        return EMPTY;
      }
    });
    task.bindPlatform(platform);
  }

  private validate(mode: string): Observable<unknown> {
    switch (mode) {
      case 'cancel': return this.answerService.reloadAnswer();
      case 'nextImmediate': return this.navigateToNextItem();
      case 'next': return this.answerService.submitAnswer().pipe(switchMap(() => this.navigateToNextItem()));
      case 'top': return this.answerService.submitAnswer().pipe(switchMap(() => this.scrollTop()));
      default: return this.answerService.submitAnswer();
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

  private scrollTop(): Observable<void> {
    return animationFrames().pipe(take(1), map(() => window.scrollTo({ behavior: 'smooth', top: 0 })));
  }

  private navigateToItem(path: string, newTab = false): Observable<void> {
    const [ , ...parentIds ] = path.split('/');
    const id = parentIds.pop();
    if (!id) throw new Error('id must be defined');

    const route = itemRoute('activity', id, parentIds);
    newTab
      ? this.navigate(this.router.serializeUrl(this.itemRouter.url(route)), true)
      : this.itemRouter.navigateTo(route);
    return EMPTY;
  }

  private navigate(href: string, newTab = false): void {
    const url = this.formatUrl(href);
    newTab
      ? window.open(url, '_blank')
      : window.location.href = url;
  }

  private formatUrl(href: string): string {
    if (href.startsWith('http')) return href;
    const url = new URL(this.localeService.currentLang?.path ?? '/', window.location.href);
    url.hash = href;
    return url.href;
  }
}
