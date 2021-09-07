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
    this.itemTaskInit.task$.pipe(switchMap(task => task.getViews())), // Load views once the task has been loaded
    this.display$.pipe(map(({ views }) => views), filter(isNotUndefined)), // listen to display updates
  ).pipe(map(views => Object.entries(views).filter(([ , view ]) => !view.requires).map(([ name ]) => name)));

  private activeViewSubject = new BehaviorSubject<string>('task');
  readonly activeView$ = this.activeViewSubject.asObservable();
  private showViews$ = combineLatest([ this.itemTaskInit.task$, this.activeViewSubject ]).pipe(
    switchMap(([ task, view ]) => task.showViews({ [view]: true }))
  );

  private subscriptions = [
    this.showViews$.subscribe({ error: err => this.itemTaskInit.setError(err) }),
  ];

  constructor(
    private itemTaskInit: ItemTaskInitService,
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
