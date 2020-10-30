import { Component, OnDestroy } from '@angular/core';
import { ItemDataSource } from '../../services/item-datasource.service';
import { RecentActivity, RecentActivityService } from 'src/app/shared/http-services/recent-activity.service';
import { catchError, switchMap } from 'rxjs/operators';
import { combineLatest, concat, of, Subscription } from 'rxjs';
import { CurrentUserService } from 'src/app/shared/services/current-user.service';

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ]
})
export class ItemLogViewComponent implements OnDestroy {

  subscription: Subscription;
  logData: RecentActivity[]|'loading'|'error';

  constructor(
    private currentUserService: CurrentUserService,
    private itemDataSource: ItemDataSource,
    private recentActivityService: RecentActivityService
  ) {
    this.logData = 'loading';

    // Get user id and item id, and then make the request
    this.subscription = combineLatest([
      this.currentUserService.currentUser$,
      this.itemDataSource.item$
    ]).pipe(
      switchMap(([ user, item ]) => {
        const itemId = item.id;
        const userId = user?.id;
        if (userId === undefined) {
          return of('error' as const);
        }
        return concat(
          of('loading' as const),
          this.recentActivityService.getRecentActivity(itemId, userId).pipe(catchError(_ => of('error' as const)))
        );
      })
    ).subscribe(data => {
      this.logData = data;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
