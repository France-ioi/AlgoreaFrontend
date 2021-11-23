import { Component, OnDestroy, ViewChild } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';
import { RouterLinkActive } from '@angular/router';
import { TaskTab } from '../item-display/item-display.component';
import { Mode, ModeService } from 'src/app/shared/services/mode.service';
import { fromEvent, Observable, of, Subject } from 'rxjs';
import { catchError, endWith, last, map, shareReplay, switchMap, take, takeUntil } from 'rxjs/operators';
import { ConfigureTaskOptions } from '../../services/item-task.service';
import { BeforeUnloadComponent } from 'src/app/shared/guards/before-unload-guard';
import { ItemContentComponent } from '../item-content/item-content.component';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy, BeforeUnloadComponent {
  @ViewChild('progressTab') progressTab?: RouterLinkActive;
  @ViewChild(ItemContentComponent) itemContentComponent?: ItemContentComponent;

  itemData$ = this.itemDataSource.state$;

  showAccessCodeField$ = this.itemData$.pipe(
    mapStateData(data =>
      data.item.promptToJoinGroupByCode && !canCurrentUserViewItemContent(data.item) && !this.userService.isCurrentUserTemp()
    ),
    map(state => state.isReady && state.data),
  );

  taskTabs: TaskTab[] = [];
  taskView?: TaskTab['view'];

  readonly fullFrameContent$ = this.layoutService.fullFrameContent$;
  readonly watchedGroup$ = this.userService.watchedGroup$;
  readonly taskOptions$: Observable<ConfigureTaskOptions> = this.modeService.mode$.pipe(map(mode => ({
    readOnly: mode === Mode.Watching,
    shouldLoadAnswer: mode === Mode.Normal,
  })));

  readonly enableLoadSubmission$ = this.modeService.mode$.pipe(map(mode => mode === Mode.Normal));
  savingAnswer = false;

  private skipBeforeUnload$ = new Subject<void>();

  private subscriptions = [
    this.itemDataSource.state$.subscribe(state => {
      if (state.isFetching) this.taskTabs = []; // reset task tabs when item changes.
    }),
    fromEvent<BeforeUnloadEvent>(globalThis, 'beforeunload', { capture: true })
      .pipe(switchMap(() => this.itemContentComponent?.itemDisplayComponent?.saveAnswerAndState() ?? of(undefined)), take(1))
      .subscribe(),
  ];

  constructor(
    private userService: UserSessionService,
    private itemDataSource: ItemDataSource,
    private layoutService: LayoutService,
    private modeService: ModeService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

  patchStateWithScore(score: number): void {
    this.itemDataSource.patchItemScore(score);
  }

  setTaskTabs(taskTabs: TaskTab[]): void {
    this.taskTabs = taskTabs;
  }

  setTaskTabActive(tab: TaskTab): void {
    this.taskView = tab.view;
  }

  beforeUnload(): Observable<boolean> {
    if (!this.itemContentComponent?.itemDisplayComponent) return of(true);
    const save$ = this.itemContentComponent.itemDisplayComponent.saveAnswerAndState().pipe(
      takeUntil(this.skipBeforeUnload$),
      endWith({ saving: false }),
      shareReplay(1),
    );
    save$.subscribe(({ saving }) => this.savingAnswer = saving);
    const canUnload$ = save$.pipe(map(({ saving }) => !saving), last(), catchError(() => of(true)));
    return canUnload$;
  }

  skipBeforeUnload(): void {
    this.skipBeforeUnload$.next();
  }

}
