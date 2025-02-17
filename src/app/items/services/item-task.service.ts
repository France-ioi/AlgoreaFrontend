import { Location } from '@angular/common';
import { Injectable, OnDestroy } from '@angular/core';
import { animationFrames, EMPTY, merge, Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { ActivityNavTreeService } from 'src/app/services/navigation/item-nav-tree.service';
import { openNewTab, replaceWindowUrl } from 'src/app/utils/url';
import { FullItemRoute } from 'src/app/models/routing/item-route';
import { AskHintService } from '../data-access/ask-hint.service';
import { Answer as GetAnswerType } from '../data-access/get-answer.service';
import { Task, TaskPlatform } from '../api/task-proxy';
import { ItemTaskAnswerService } from './item-task-answer.service';
import { ItemTaskInitService } from './item-task-init.service';
import { ItemTaskViewsService } from './item-task-views.service';

export type Answer = Pick<GetAnswerType, 'id'|'authorId'|'answer'|'state'|'score'> & Partial<Pick<GetAnswerType, 'createdAt'>>;

export interface TaskConfig {
  readOnly: boolean,
  initialAnswer: Answer | undefined /* not defined yet */ | null /* no initial answer */,
  locale?: string,
}

@Injectable()
export class ItemTaskService implements OnDestroy {
  readonly destroyed$ = new Subject<void>();
  readonly unknownError$ = merge(this.answerService.error$, this.viewsService.error$).pipe(takeUntil(this.destroyed$), shareReplay(1));
  readonly initError$ = this.initService.initError$.pipe(takeUntil(this.destroyed$), shareReplay(1));
  readonly urlError$ = this.initService.urlError$.pipe(takeUntil(this.destroyed$), shareReplay(1));
  readonly hintError$ = new Subject<void>();

  readonly error$ = merge(
    this.initError$,
    this.urlError$,
    this.unknownError$,
  ).pipe(switchMap(error => throwError(() => error)));

  readonly task$ = this.initService.task$;
  readonly loadedTask$ = this.initService.loadedTask$;
  readonly iframeSrc$ = this.initService.iframeSrc$;
  get initialized(): boolean {
    return this.initService.initialized;
  }

  private readonly navigateTo = new Subject<(
    { url: string } |
    { id: string, path?: string[] } |
    { textId: string } |
    { nextActivity: true }
  ) & { newTab: boolean }>();
  readonly navigateTo$ = this.navigateTo.asObservable();

  readonly views$ = this.viewsService.views$;
  readonly display$ = this.viewsService.display$;
  readonly activeView$ = this.viewsService.activeView$;

  readonly scoreChange$ = this.answerService.scoreChange$;
  readonly unlockedItems$ = this.answerService.unlockedItems$;
  readonly autoSaveResult$ = this.answerService.autoSaveResult$;

  private navigateToNext$ = this.activityNavTreeService.navigationNeighbors$.pipe(
    map(neighborsState => (neighborsState.isReady ? (neighborsState.data?.next ?? neighborsState.data?.parent)?.navigateTo : undefined)),
    takeUntil(this.destroyed$),
    shareReplay(1),
  );

  private readOnly = false;
  private attemptId$ = new ReplaySubject(1);

  constructor(
    private initService: ItemTaskInitService,
    private answerService: ItemTaskAnswerService,
    private viewsService: ItemTaskViewsService,
    private activityNavTreeService: ActivityNavTreeService,
    private location: Location,
    private askHintService: AskHintService,
  ) {}

  ngOnDestroy(): void {
    this.hintError$.complete();
    this.navigateTo.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  configure(route: FullItemRoute, url: string, attemptId: string | undefined, options: TaskConfig): void {
    this.readOnly = options.readOnly;
    this.attemptId$.next(attemptId);
    this.initService.configure(route, url, attemptId, options.initialAnswer, options.locale, options.readOnly);
  }

  initTask(iframe: HTMLIFrameElement): void {
    this.initService.initTask(iframe, task => this.bindPlatform(task));
  }

  showView(view: string): void {
    this.viewsService.showView(view);
  }

  saveAnswerAndState(): ReturnType<ItemTaskAnswerService['saveTaskStateAnswerAsCurrent']> {
    return this.answerService.saveTaskStateAnswerAsCurrent();
  }

  private bindPlatform(task: Task): void {
    const platform: TaskPlatform = {
      validate: mode => (this.readOnly ? this.validateReadOnly(mode) : this.validate(mode)).pipe(map(() => undefined)),
      getTaskParams: () => this.getTaskParams() ,
      updateHeight: height => platform.updateDisplay({ height }),
      updateDisplay: display => this.viewsService.updateDisplay(display),
      showView: view => this.viewsService.showView(view),
      openUrl: params => {
        if (typeof params === 'string') return this.navigateToItem({ path: params }, false);
        if ('path' in params) return this.navigateToItem(params, params.newTab ?? false);
        if ('itemId' in params) return this.navigateToItem(params, params.newTab ?? false);
        if ('textId' in params) return this.navigateToItem(params, params.newTab ?? false);
        if ('url' in params) return this.navigateToUrl(params.url, params.newTab ?? true);
      },
      askHint: (hintToken: string) => this.askHint(hintToken).pipe(
        take(1),
        switchMap(taskToken => task.updateToken(taskToken)),
        map(() => undefined),
        takeUntil(this.destroyed$),
        shareReplay(1),
      ),
      log: (messages: string[]) => {
        // eslint-disable-next-line no-console
        console.log(...messages);
      },
    };
    task.bindPlatform(platform);
  }

  private validate(mode: string): Observable<void> {
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

  private getTaskParams(): ReturnType<TaskPlatform['getTaskParams']> {
    /** Note that getTaskParams() will never respond if no attempt_id is configured */
    return this.task$.pipe(
      switchMap(task => task.getMetaData()),
      switchMap(({ usesRandomSeed }) => {
        if (!usesRandomSeed) return of({ randomSeed: 0 });
        else return this.attemptId$.pipe(
          map(attemptId => {
            const randomSeed = Number(attemptId);
            // attempt id can be used as a seed as these are currently assigned incrementally by participant id
            // If this changes, this needs to be adapted.
            if (Number.isNaN(randomSeed)) throw new Error('random seed must be a number');
            return { randomSeed };
          })
        );
      }),
      map(({ randomSeed }) => ({
        minScore: 0,
        maxScore: 100,
        hideTitle: true,
        supportsTabs: true,
        randomSeed,
        noScore: 0,
        readOnly: this.readOnly,
        options: {},
      }))
    );
  }

  private navigateToNextItem(): Observable<void> {
    this.navigateTo.next({ nextActivity: true, newTab: false });
    return of(undefined);
  }

  private scrollTop(): Observable<void> {
    return animationFrames().pipe(take(1), tap(() => window.scrollTo({ behavior: 'smooth', top: 0 })), map(() => undefined));
  }

  private navigateToItem(dst: { path: string }|{ itemId: string }|{ textId: string }, newTab: boolean): void {
    if ('textId' in dst) this.navigateTo.next({ textId: dst.textId, newTab });
    if ('itemId' in dst) this.navigateTo.next({ id: dst.itemId, newTab });
    if ('path' in dst) {
      const path = dst.path.split('/'); // always return a non-empty array
      const id = path.pop()!;
      this.navigateTo.next({ id, path, newTab: newTab });
    }
  }

  private navigateToUrl(href: string, newTab: boolean): void {
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
