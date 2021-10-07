import { Component, OnDestroy, ViewChild } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';
import { ActivatedRoute, RouterLinkActive } from '@angular/router';
import { TaskTab } from '../item-display/item-display.component';

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
  defaultTaskView?: TaskTab['view'];

  fullFrameContent$ = this.layoutService.fullFrameContent$;
  readonly watchedGroup$ = this.userService.watchedGroup$;

  private subscription = this.activatedRoute.params.subscribe(() => {
    this.taskTabs = []; // reset task tabs when item changes.
  });

  constructor(
    private userService: UserSessionService,
    private itemDataSource: ItemDataSource,
    private layoutService: LayoutService,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

  setTaskTabs(taskTabs: TaskTab[]): void {
    this.taskTabs = taskTabs;
    this.defaultTaskView = taskTabs.find(tab => tab.active)?.view;
  }

}
