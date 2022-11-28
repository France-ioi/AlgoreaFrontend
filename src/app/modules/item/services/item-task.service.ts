import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { animationFrames, combineLatest, EMPTY, merge, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, mapTo, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ActivityNavTreeService } from 'src/app/core/services/navigation/item-nav-tree.service';
import { openNewTab, replaceWindowUrl } from 'src/app/shared/helpers/url';
import { FullItemRoute, itemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { AskHintService } from '../http-services/ask-hint.service';
import { Answer } from '../http-services/get-answer.service';
import { Task, TaskPlatform } from '../task-communication/task-proxy';
import { ItemTaskAnswerService } from './item-task-answer.service';
import { ItemTaskInitService } from './item-task-init.service';
import { ItemTaskViewsService } from './item-task-views.service';

export interface TaskConfig {
  readOnly: boolean,
  formerAnswer: Answer | null,
  locale?: string,
}

@Injectable()
export class ItemTaskService {
  readonly unknownError$ = merge(this.answerService.error$, this.viewsService.error$).pipe(shareReplay(1));
  readonly initError$ = this.initService.initError$.pipe(shareReplay(1));
  readonly urlError$ = this.initService.urlError$.pipe(shareReplay(1));
  readonly hintError$ = new Subject<void>();

  readonly error$ = merge(
    this.initError$,
    this.urlError$,
    this.unknownError$,
  ).pipe(switchMap(error => throwError(() => error)));

  readonly task$ = this.initService.task$;
  readonly iframeSrc$ = this.initService.iframeSrc$;
  get initialized(): boolean {
    return this.initService.initialized;
  }

  readonly views$ = this.viewsService.views$;
  readonly display$ = this.viewsService.display$;
  readonly activeView$ = this.viewsService.activeView$;

  readonly scoreChange$ = this.answerService.scoreChange$;
  readonly saveAnswerAndStateInterval$ = this.answerService.saveAnswerAndStateInterval$;

  private navigateToNext$ = this.activityNavTreeService.navigationNeighbors$.pipe(
    map(neighborsState => (neighborsState.isReady ? (neighborsState.data?.next ?? neighborsState.data?.parent)?.navigateTo : undefined)),
    shareReplay(1),
  );

  private readOnly = false;
  private attemptId?: string;

  constructor(
    private initService: ItemTaskInitService,
    private answerService: ItemTaskAnswerService,
    private viewsService: ItemTaskViewsService,
    private itemRouter: ItemRouter,
    private activityNavTreeService: ActivityNavTreeService,
    private router: Router,
    private location: Location,
    private askHintService: AskHintService,
  ) {}

  configure(route: FullItemRoute, url: string, attemptId: string, options: TaskConfig): void {
    this.readOnly = options.readOnly;
    this.attemptId = attemptId;
    this.initService.configure(route, url, attemptId, options.formerAnswer, options.locale, options.readOnly);
  }

  initTask(iframe: HTMLIFrameElement): void {
    this.initService.initTask(iframe, task => this.bindPlatform(task));
  }

  showView(view: string): void {
    this.viewsService.showView(view);
  }

  saveAnswerAndState(): Observable<{ saving: boolean }> {
    return this.answerService.saveAnswerAndState();
  }

  private bindPlatform(task: Task): void {
    if (!this.attemptId) throw new Error('attemptId must be defined. The "configure" method has probably not been called as expected');
    // attempt id can be used as a seed as these are currently assigned incrementally by participant id
    // If this changes, this needs to be adapted.
    const randomSeed = Number(this.attemptId);
    if (Number.isNaN(randomSeed)) throw new Error('random seed must be a number');

    const platform: TaskPlatform = {
      validate: mode => (this.readOnly ? this.validateReadOnly(mode) : this.validate(mode)).pipe(mapTo(undefined)),
      getTaskParams: () => ({
        minScore: 0,
        maxScore: 100,
        randomSeed,
        noScore: 0,
        readOnly: this.readOnly,
        options: {},
      }),
      updateHeight: height => platform.updateDisplay({ height }),
      updateDisplay: display => this.viewsService.updateDisplay(display),
      showView: view => this.viewsService.showView(view),
      openUrl: params => {
        if (typeof params === 'string') return this.navigateToItem(params);
        if ('path' in params) return this.navigateToItem(params.path, params.newTab);
        if ('itemId' in params) return this.navigateToItem(params.itemId);
        return this.navigate(params.url, params.newTab);
      },
      askHint: (hintToken: string) => combineLatest([ this.askHint(hintToken), this.task$ ]).pipe(
        take(1),
        switchMap(([ taskToken, task ]) => task.updateToken(taskToken)),
        map(() => undefined),
        shareReplay(1),
      ),
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

  private validateReadOnly(mode: string): Observable<unknown> {
    switch (mode) {
      case 'cancel': return EMPTY;
      case 'nextImmediate': return this.navigateToNextItem();
      case 'next': return this.navigateToNextItem();
      case 'top': return this.scrollTop();
      default: return EMPTY;
    }
  }

  private navigateToNextItem(): Observable<void> {
    return this.navigateToNext$.pipe(
      take(1),
      tap(nav => {
        if (nav) nav();
      }),
      map(() => undefined),
    );
  }

  private scrollTop(): Observable<void> {
    return animationFrames().pipe(take(1), tap(() => window.scrollTo({ behavior: 'smooth', top: 0 })), map(() => undefined));
  }

  private navigateToItem(path: string, newTab = false): void {
    const ids = path.split('/');
    const id = ids.pop();
    if (!id) throw new Error(`id must be defined. Received path: '${path}'.`);

    const route = itemRoute('activity', id, ids);
    if (newTab) this.navigate(this.router.serializeUrl(this.itemRouter.url(route)), true);
    else this.itemRouter.navigateTo(route);
  }

  private navigate(href: string, newTab = false): void {
    if (newTab) openNewTab(href, this.location);
    else replaceWindowUrl(href, this.location);
  }

  private askHint(hintToken: string): Observable<string> {
    return this.initService.taskToken$.pipe(
      switchMap(taskToken => this.askHintService.ask(taskToken, hintToken)),
      map(data => data.taskToken),
      catchError(err => {
        this.hintError$.next();
        throw err;
      }),
    );
  }
}
