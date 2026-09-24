import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Store } from '@ngrx/store';
import { fromNotification, notificationApiActions } from '../../store/notification';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimeComponent } from 'src/app/ui-components/relative-time/relative-time.component';
import { ToDatePipe } from 'src/app/pipes/toDate';
import {
  DisplayableNotification,
  GroupResultsExportReadyNotification,
  isDisplayableNotification,
  isForumNewMessageNotification,
  isGroupResultsExportFailedNotification,
  isGroupResultsExportReadyNotification,
} from 'src/app/models/notification';
import {
  exportFailedSummary,
  exportReadySummary,
} from 'src/app/models/notification-display';
import { mapStateData } from 'src/app/utils/state';
import { MessageService } from 'src/app/services/message.service';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { NotificationInteractionService } from 'src/app/services/notification-interaction.service';

@Component({
  selector: 'alg-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  imports: [
    CdkMenuTrigger,
    CdkMenu,
    CdkMenuItem,
    LoadingComponent,
    ErrorComponent,
    RelativeTimeComponent,
    ToDatePipe,
    DatePipe,
  ],
})
export class NotificationBellComponent {
  private store = inject(Store);
  private messageService = inject(MessageService);
  private notificationService = inject(NotificationHttpService);
  private notificationInteraction = inject(NotificationInteractionService);
  private destroyRef = inject(DestroyRef);

  private rawState = this.store.selectSignal(fromNotification.selectNotificationsState);

  readonly isForumNewMessageNotification = isForumNewMessageNotification;
  readonly isGroupResultsExportReadyNotification = isGroupResultsExportReadyNotification;
  readonly isGroupResultsExportFailedNotification = isGroupResultsExportFailedNotification;

  notificationsState = computed(() =>
    mapStateData(this.rawState(), data => data.filter(isDisplayableNotification))
  );

  badgeText = computed(() => {
    const s = this.notificationsState();
    switch (s.tag) {
      case 'fetching': return '?';
      case 'error': return '!';
      case 'ready': return String(s.data.filter(n => n.readTime === undefined).length);
    }
  });

  isExportLinkExpired(notification: GroupResultsExportReadyNotification): boolean {
    return this.notificationInteraction.isExportLinkExpired(notification);
  }

  isDownloading(notification: GroupResultsExportReadyNotification): boolean {
    return this.notificationInteraction.isDownloading(notification);
  }

  readySummary(notification: GroupResultsExportReadyNotification): string {
    return exportReadySummary(notification.payload.groupName, notification.payload.items);
  }

  failedSummary(groupName: string, error: string): string {
    return exportFailedSummary(groupName, error);
  }

  onNotificationClick(notification: DisplayableNotification): void {
    this.notificationInteraction.activate$(notification).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onClearClick(event: Event, notification: DisplayableNotification): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationInteraction.clear$(notification.sk).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  clearAll(): void {
    this.notificationService.deleteAllNotifications().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.store.dispatch(notificationApiActions.allNotificationsCleared()),
      error: () => this.messageService.add({
        severity: 'error',
        detail: $localize`Failed to clear notifications`,
      }),
    });
  }
}
