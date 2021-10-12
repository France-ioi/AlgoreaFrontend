import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, merge, ReplaySubject, Subject } from 'rxjs';
import { delayWhen, distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { TaskViews, UpdateDisplayParams } from '../task-communication/types';
import { ItemTaskInitService } from './item-task-init.service';

@Injectable()
export class ItemTaskViewsService implements OnDestroy {
  private errorSubject = new Subject<void>();
  readonly error$ = this.errorSubject.asObservable();

  private displaySubject = new ReplaySubject<UpdateDisplayParams>(1);
  readonly display$ = this.displaySubject.asObservable().pipe(takeUntil(this.error$));
  private task$ = this.initService.task$.pipe(takeUntil(this.error$));

  readonly views$ = merge(
    this.task$.pipe(switchMap(task => task.getViews())),
    this.display$.pipe(map(({ views }) => views), filter(isNotUndefined)),
  ).pipe(map(views => this.getAvailableViews(views)));

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
    this.showViews$.subscribe({ error: err => this.errorSubject.next(err) }),
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
      .map(([ name ]) => name);
  }
}
