import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, merge, ReplaySubject, Subject } from 'rxjs';
import { combineLatestWith, delayWhen, distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { TaskViews, UpdateDisplayParams } from '../task-communication/types';
import { ItemTaskInitService } from './item-task-init.service';

@Injectable()
export class ItemTaskViewsService implements OnDestroy {
  private errorSubject = new Subject<Error>();
  readonly error$ = this.errorSubject.asObservable();

  private displaySubject = new ReplaySubject<UpdateDisplayParams>(1);
  readonly display$ = this.displaySubject.asObservable().pipe(takeUntil(this.error$));
  private task$ = this.initService.task$.pipe(takeUntil(this.error$));

  readonly views$ = merge(
    this.task$.pipe(switchMap(task => task.getViews())),
    this.display$.pipe(map(({ views }) => views), filter(isNotUndefined)),
  ).pipe(
    combineLatestWith(this.task$.pipe(switchMap(task => task.getMetaData()))),
    map(([ views, { disablePlatformProgress }]) => {
      const availableViews = this.getAvailableViews(views);
      return disablePlatformProgress ? availableViews : [ ...availableViews, 'progress' ];
    }),
  );

  private activeViewSubject = new ReplaySubject<string>(1);
  readonly activeView$ = this.activeViewSubject.pipe(
    distinctUntilChanged(),
    delayWhen(() => this.task$), // start emitting only when task is loaded since it makes no sense to emit before
  );

  // By default, load 'task' view when the task is initialized
  private showViews$ = combineLatest([ this.initService.task$, this.activeView$ ]).pipe(
    switchMap(([ task, view ]) => task.showViews({ [view]: true })),
  );

  private subscriptions = [
    this.showViews$.subscribe({
      error: err => this.errorSubject.next(err instanceof Error ? err : new Error('unknown error')),
    }),
    combineLatest([
      this.initService.iframe$,
      this.display$.pipe(map(display => display.scrollTop), filter(isNotUndefined)),
    ]).subscribe(([ iframe, scrollTopInPx ]) => {
      const iframeTopInPx = iframe.getBoundingClientRect().top + globalThis.scrollY;
      globalThis.scrollTo({ behavior: 'smooth', top: iframeTopInPx + scrollTopInPx });
    }),
  ];

  constructor(
    private initService: ItemTaskInitService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.displaySubject.complete();
    this.activeViewSubject.complete();
    this.errorSubject.complete();
  }

  updateDisplay(display: UpdateDisplayParams): void {
    this.displaySubject.next(display);
  }

  showView(view: string): void {
    this.activeViewSubject.next(view);
  }

  private getAvailableViews(views: TaskViews): string[] {
    return Object.entries(views)
      .filter(([ name, view ], _index, entries) => {
        const requiresOtherView = !!view.requires;
        const isIncludedInOtherView = entries.some(([ , otherView ]) => !!otherView.includes?.includes(name));
        return !requiresOtherView && !isIncludedInOtherView;
      })
      .map(([ name ]) => name)
      .sort((a, b) => this.sortView(a, b));
  }

  private sortView(a: string, b: string): number {
    const weights: Record<string, number> = {
      task: 0, // Statement
      editor: 1, // Solve
      submission: 2, // Submission
      hints: 3, // Hints
      forum: 4, // Forum
      solution: 5,// Solution
    };
    const unknownViewWeight = Math.max(...Object.values(weights)) + 1;
    return (weights[a] ?? unknownViewWeight) - (weights[b] ?? unknownViewWeight);
  }
}
