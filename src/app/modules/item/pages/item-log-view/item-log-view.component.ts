import { Component, OnDestroy, OnInit } from '@angular/core';
import { ItemDataSource } from '../../services/item-datasource.service';
import { RecentActivity, RecentActivityService } from 'src/app/shared/http-services/recent-activity.service';
import { catchError, switchMap } from 'rxjs/operators';
import { combineLatest, concat, of, Subscription } from 'rxjs';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-item-log-view',
  templateUrl: './item-log-view.component.html',
  styleUrls: [ './item-log-view.component.scss' ]
})
export class ItemLogViewComponent implements OnInit, OnDestroy {

  subscription?: Subscription;
  logData: RecentActivity[]|'loading'|'error' = 'loading';

  constructor(
    private sessionService: UserSessionService,
    private itemDataSource: ItemDataSource,
    private recentActivityService: RecentActivityService
  ) {}

  ngOnInit(): void {
    // Get user id and item id, and then make the request
    this.subscription = combineLatest([
      this.sessionService.currentUser$,
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
    this.subscription?.unsubscribe();
  }
}
