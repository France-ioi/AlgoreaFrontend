import { Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemData, ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';
import { RouterLinkActive } from '@angular/router';
import { TaskTab } from '../item-display/item-display.component';
import { combineLatestWith, map, startWith } from 'rxjs/operators';
import { FetchState } from 'src/app/shared/helpers/state';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy {
  @ViewChild('progressTab') progressTab?: RouterLinkActive;
  @Output() scoreChange = new EventEmitter<number>();

  itemData$ = this.itemDataSource.state$.pipe(
    combineLatestWith(this.scoreChange.pipe(startWith(undefined))),
    map(([ state, newScore ]) => this.patchStateWithNewScore(state, newScore))
  );

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

  private subscription = this.itemDataSource.state$.subscribe(state => {
    if (state.isFetching) this.taskTabs = []; // reset task tabs when item changes.
  });

  constructor(
    private userService: UserSessionService,
    private itemDataSource: ItemDataSource,
    private layoutService: LayoutService,
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

  setTaskTabs(taskTabs: TaskTab[]): void {
    this.taskTabs = taskTabs;
  }

  setTaskTabActive(tab: TaskTab): void {
    this.taskView = tab.view;
  }

  private patchStateWithNewScore(state: FetchState<ItemData>, newScore?: number): FetchState<ItemData> {
    if (!state.isReady) return state;
    const score = newScore ?? state.data.currentResult?.score ?? 0;
    const bestScore = Math.max(state.data.item.bestScore, score);
    const validated = bestScore === 100;
    return {
      ...state,
      data: {
        ...state.data,
        item: { ...state.data.item, bestScore },
        currentResult: state.data.currentResult ? { ...state.data.currentResult, score, validated } : undefined,
      },
    };
  }

}
