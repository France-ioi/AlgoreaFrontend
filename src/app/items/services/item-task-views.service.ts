import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, EMPTY, merge, ReplaySubject, Subject } from 'rxjs';
import { catchError, delayWhen, distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { TaskViews, UpdateDisplayParams } from '../api/types';
import { ItemTaskInitService } from './item-task-init.service';

@Injectable()
export class ItemTaskViewsService implements OnDestroy {
  private errorSubject = new Subject<unknown>();
  readonly error$ = this.errorSubject.asObservable();

  private displaySubject = new ReplaySubject<UpdateDisplayParams>(1);
  readonly display$ = this.displaySubject.asObservable().pipe(takeUntil(this.error$));
  private loadedTask$ = this.initService.loadedTask$.pipe(catchError(() => EMPTY), takeUntil(this.error$));

  private readonly views = merge(
    this.loadedTask$.pipe(switchMap(task => task.getViews())),
    this.display$.pipe(map(({ views }) => views), filter(isNotUndefined)),
  ).pipe(
    map(views => this.getAvailableViews(views)),
  ); // may error if `task.getViews()` fails (e.g., timeout)
  readonly views$ = this.views.pipe(catchError(() => EMPTY)); // never emit errors

  private activeViewSubject = new ReplaySubject<string>(1);
  readonly activeView$ = this.activeViewSubject.pipe(
    distinctUntilChanged(),
    delayWhen(() => this.loadedTask$), // start emitting only when task is loaded since it makes no sense to emit before
  );

  // By default, load 'task' view when the task is initialized
  private showViews$ = combineLatest([ this.loadedTask$, this.activeView$ ]).pipe(
    switchMap(([ task, view ]) => task.showViews({ [view]: true })),
  );

  private subscriptions = [
    combineLatest([ this.showViews$, this.views ]).subscribe({
      error: err => this.errorSubject.next(err),
    }),
    combineLatest([
      this.initService.iframe$,
      this.display$.pipe(map(display => display.scrollTop), filter(isNotUndefined)),
    ]).subscribe(([ iframe, scrollTopInPx ]) => {
      const mainContentWrapperEl = window.document.querySelector('#main-content-wrapper');
      if (!mainContentWrapperEl) throw new Error('Unexpected: Missed main content wrapper element');
      const iframeTopInPx = iframe.getBoundingClientRect().top + mainContentWrapperEl.scrollTop;
      mainContentWrapperEl.scrollTo({ behavior: 'smooth', top: iframeTopInPx + scrollTopInPx });
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
