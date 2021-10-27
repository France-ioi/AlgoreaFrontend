import { Component, OnDestroy, ViewChild } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';
import { RouterLinkActive } from '@angular/router';
import { TaskTab } from '../item-display/item-display.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy {
  @ViewChild('progressTab') progressTab?: RouterLinkActive;

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

  patchStateWithScore(score: number): void {
    this.itemDataSource.patchItemScore(score);
  }

  setTaskTabs(taskTabs: TaskTab[]): void {
    this.taskTabs = taskTabs;
  }

  setTaskTabActive(tab: TaskTab): void {
    this.taskView = tab.view;
  }

}
