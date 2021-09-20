import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, merge, ReplaySubject } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { isNotUndefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { UpdateDisplayParams } from '../task-communication/types';
import { ItemTaskInitService } from './item-task-init.service';

@Injectable()
export class ItemTaskViewsService implements OnDestroy {
  private displaySubject = new ReplaySubject<UpdateDisplayParams>(1);
  readonly display$ = this.displaySubject.asObservable();

  readonly views$ = merge(
    this.initService.task$.pipe(switchMap(task => task.getViews())),
    this.display$.pipe(map(({ views }) => views), filter(isNotUndefined)),
  ).pipe(map(views => Object.entries(views).filter(([ , view ]) => !view.requires).map(([ name ]) => name)));

  private activeViewSubject = new BehaviorSubject<string>('task');
  readonly activeView$ = this.activeViewSubject.asObservable();

  // By default, load 'task' view when the task is initialized
  private showViews$ = combineLatest([ this.initService.task$, this.activeView$ ]).pipe(
    switchMap(([ task, view ]) => task.showViews({ [view]: true })),
  );

  private subscriptions = [
    this.showViews$.subscribe({ error: err => this.initService.setError(err) }),
  ];

  constructor(
    private initService: ItemTaskInitService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  updateDisplay(display: UpdateDisplayParams): void {
    this.displaySubject.next(display);
  }

  showView(view: string): void {
    this.activeViewSubject.next(view);
  }
}
