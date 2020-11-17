import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { RecentActivity, RecentActivityService } from 'src/app/shared/http-services/recent-activity.service';
import { Subscription } from 'rxjs';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ]
})
export class ItemLogViewComponent implements OnDestroy, OnChanges {

  @Input() itemData?: ItemData;

  state: 'loading'|'error'|'ready' = 'loading';
  logData: RecentActivity[] = [];

  private subscription?: Subscription;

  constructor(
    private sessionService: UserSessionService,
    private recentActivityService: RecentActivityService
  ) {}

  ngOnChanges(): void {
    this.reloadData();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private reloadData(): void {
    const currentUser = this.sessionService.session$.value;
    if (this.itemData && currentUser) {
      this.state = 'loading';
      this.subscription?.unsubscribe(); // cancel ongoing requests
      this.subscription = this.recentActivityService.getRecentActivity(this.itemData.item.id, currentUser.user.id).subscribe(
        data => {
          this.state = 'ready';
          this.logData = data;
        },
        _err => this.state = 'error'
      );
    }
  }

}
