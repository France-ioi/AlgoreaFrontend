import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { animationFrames, merge, Observable, throwError } from 'rxjs';
import { map, mapTo, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { LocaleService } from 'src/app/core/services/localeService';
import { ActivityNavTreeService } from 'src/app/core/services/navigation/item-nav-tree.service';
import { openNewTab, replaceWindowUrl } from 'src/app/shared/helpers/url';
import { FullItemRoute, itemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { Task, TaskPlatform } from '../task-communication/task-proxy';
import { ItemTaskAnswerService } from './item-task-answer.service';
import { ItemTaskInitService } from './item-task-init.service';
import { ItemTaskViewsService } from './item-task-views.service';

@Injectable()
export class ItemTaskService {
  readonly unknownError$ = merge(this.answerService.error$, this.viewsService.error$).pipe(shareReplay(1));
  readonly initError$ = this.initService.initError$.pipe(shareReplay(1));
  readonly urlError$ = this.initService.urlError$.pipe(shareReplay(1));

  private error$ = merge(this.initError$, this.urlError$, this.unknownError$).pipe(switchMap(error => throwError(() => error)));

  readonly task$ = merge(this.initService.task$, this.error$);
  readonly iframeSrc$ = this.initService.iframeSrc$;
  get initialized(): boolean {
    return this.initService.initialized;
  }

  readonly views$ = this.viewsService.views$;
  readonly display$ = this.viewsService.display$;
  readonly activeView$ = this.viewsService.activeView$;

  private navigateToNext$ = this.activityNavTreeService.navigationNeighbors$.pipe(
    map(neighborsState => (neighborsState.isReady ? neighborsState.data?.next?.navigateTo : undefined)),
    shareReplay(1),
  );

  constructor(
    private initService: ItemTaskInitService,
    private answerService: ItemTaskAnswerService,
    private viewsService: ItemTaskViewsService,
    private itemRouter: ItemRouter,
    private activityNavTreeService: ActivityNavTreeService,
    private router: Router,
    private localeService: LocaleService,
  ) {}

  configure(route: FullItemRoute, url: string, attemptId: string): void {
    this.initService.configure(route, url, attemptId);
  }

  initTask(iframe: HTMLIFrameElement): void {
    this.initService.initTask(iframe, task => this.bindPlatform(task));
  }

  showView(view: string): void {
    this.viewsService.showView(view);
  }

  private bindPlatform(task: Task): void {
    const platform: TaskPlatform = {
      validate: mode => this.validate(mode).pipe(mapTo(undefined)),
      getTaskParams: () => ({ minScore: 0, maxScore: 100, randomSeed: 0, noScore: 0, readOnly: false, options: {} }),
      updateHeight: height => platform.updateDisplay({ height }),
      updateDisplay: display => this.viewsService.updateDisplay(display),
      showView: view => this.viewsService.showView(view),
      openUrl: params => {
        if (typeof params === 'string') return this.navigateToItem(params);
        if ('path' in params) return this.navigateToItem(params.path, params.newTab);
        return this.navigate(params.url, params.newTab);
      },
      askHint: () => {
        throw new Error('unimplemented method "askHint"');
      },
      log: (messages: string[]) => {
        // eslint-disable-next-line no-console
        console.log(...messages);
      },
    };
    task.bindPlatform(platform);
  }

  private validate(mode: string): Observable<unknown> {
    switch (mode) {
      case 'cancel': return this.answerService.clearAnswer();
      case 'nextImmediate': return this.navigateToNextItem();
      case 'next': return this.answerService.submitAnswer().pipe(switchMap(() => this.navigateToNextItem()));
      case 'top': return this.answerService.submitAnswer().pipe(switchMap(() => this.scrollTop()));
      default: return this.answerService.submitAnswer();
    }
  }

  private navigateToNextItem(): Observable<void> {
    return this.navigateToNext$.pipe(
      take(1),
      tap(nav => {
        if (nav) nav();
      }),
      mapTo(undefined),
    );
  }

  private scrollTop(): Observable<void> {
    return animationFrames().pipe(take(1), tap(() => window.scrollTo({ behavior: 'smooth', top: 0 })), mapTo(undefined));
  }

  private navigateToItem(path: string, newTab = false): void {
    const [ , ...parentIds ] = path.split('/');
    const id = parentIds.pop();
    if (!id) throw new Error('id must be defined');

    const route = itemRoute('activity', id, parentIds);
    if (newTab) this.navigate(this.router.serializeUrl(this.itemRouter.url(route)), true);
    else this.itemRouter.navigateTo(route);
  }

  private navigate(href: string, newTab = false): void {
    if (newTab) openNewTab(href, this.localeService.currentLang);
    else replaceWindowUrl(href, this.localeService.currentLang);
  }
}
