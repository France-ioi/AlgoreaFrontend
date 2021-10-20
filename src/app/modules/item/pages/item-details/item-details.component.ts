import { Component, OnDestroy, ViewChild } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';
import { RouterLinkActive } from '@angular/router';
import { TaskTab } from '../item-display/item-display.component';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { filter } from 'rxjs/operators';
import { isItemInfo } from 'src/app/shared/models/content/item-info';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy {
  @ViewChild('progressTab') progressTab?: RouterLinkActive;

  itemLoadingState$ = this.itemDataSource.state$.pipe(
    mapStateData(data => ({ ...data, showAccessCodeField: data.item.promptToJoinGroupByCode &&
      !canCurrentUserViewItemContent(data.item) && !this.userService.isCurrentUserTemp() }))
  );

  taskTabs: TaskTab[] = [];
  taskView?: TaskTab['view'];

  readonly fullFrameContent$ = this.layoutService.fullFrameContent$;
  readonly watchedGroup$ = this.userService.watchedGroup$;
  readonly content$ = this.currentContentService.content$.pipe(filter(isItemInfo));

  private subscription = this.itemDataSource.state$.subscribe(state => {
    if (state.isFetching) this.taskTabs = []; // reset task tabs when item changes.
  });

  constructor(
    private userService: UserSessionService,
    private itemDataSource: ItemDataSource,
    private layoutService: LayoutService,
    private currentContentService: CurrentContentService,
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

}
