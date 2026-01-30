import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, of, Subscription } from 'rxjs';
import { fromNotification, notificationWebsocketActions } from '../../store/notification';
import { fromForum } from '../../forum/store';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimePipe } from 'src/app/pipes/relativeTime';
import { ToDatePipe } from 'src/app/pipes/toDate';
import { ForumNewMessageNotification, isForumNewMessageNotification } from 'src/app/models/notification';
import { mapStateData } from 'src/app/utils/state';
import { MessageService } from 'src/app/services/message.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';

@Component({
  selector: 'alg-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  imports: [ CdkMenuTrigger, CdkMenu, CdkMenuItem, LoadingComponent, ErrorComponent, RelativeTimePipe, ToDatePipe ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private actions$ = inject(Actions);
  private messageService = inject(MessageService);
  private getItemByIdService = inject(GetItemByIdService);
  private subscription?: Subscription;

  private rawState = this.store.selectSignal(fromNotification.selectNotificationsState);

  notificationsState = computed(() =>
    mapStateData(this.rawState(), data => data.filter(isForumNewMessageNotification))
  );

  badgeText = computed(() => {
    const s = this.notificationsState();
    switch (s.tag) {
      case 'fetching': return '?';
      case 'error': return '!';
      case 'ready': return String(s.data.filter(n => n.readTime === undefined).length);
    }
  });

  ngOnInit(): void {
    this.subscription = this.actions$.pipe(
      ofType(notificationWebsocketActions.notificationReceived),
      filter(({ notification }) => isForumNewMessageNotification(notification)),
    ).subscribe(({ notification }) => {
      if (isForumNewMessageNotification(notification)) {
        this.messageService.add({
          severity: 'info',
          summary: $localize`New message`,
          detail: notification.payload.text,
          onClick: () => this.openThread(notification),
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  openThread(notification: ForumNewMessageNotification): void {
    const { participantId, itemId } = notification.payload;
    this.getItemByIdService.get(itemId).pipe(
      map(item => item.string.title),
      catchError(err => of(errorIsHTTPForbidden(err)
        ? $localize`Not visible content`
        : $localize`Error fetching content title`
      )),
    ).subscribe(title => {
      this.store.dispatch(fromForum.notificationActions.showThread({
        id: { participantId, itemId },
        item: { route: itemRoute('activity', itemId), title },
      }));
    });
  }
}
