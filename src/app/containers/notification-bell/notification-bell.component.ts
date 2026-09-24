import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';
import { fromNotification, notificationApiActions } from '../../store/notification';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimeComponent } from 'src/app/ui-components/relative-time/relative-time.component';
import { ToDatePipe } from 'src/app/pipes/toDate';
import {
  DisplayableNotification,
  ForumNewMessageNotification,
  GroupResultsExportReadyNotification,
  isDisplayableNotification,
  isForumNewMessageNotification,
  isGroupResultsExportFailedNotification,
  isGroupResultsExportReadyNotification,
} from 'src/app/models/notification';
import {
  exportFailedSummary,
  exportReadySummary,
  isExportExpiresAtPast,
} from 'src/app/models/notification-display';
import { mapStateData } from 'src/app/utils/state';
import { MessageService } from 'src/app/services/message.service';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { GroupResultsExportService } from 'src/app/data-access/group-results-export.service';
import { errorIsHTTPNotFound } from 'src/app/utils/errors';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { openHttpsDownloadUrl } from 'src/app/utils/open-https-download-url';
import { openForumThreadFromNotification$ } from 'src/app/forum/utils/open-forum-thread-from-notification';

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
  private getItemByIdService = inject(GetItemByIdService);
  private notificationService = inject(NotificationHttpService);
  private groupResultsExportService = inject(GroupResultsExportService);
  private destroyRef = inject(DestroyRef);

  private rawState = this.store.selectSignal(fromNotification.selectNotificationsState);
  private expiredExportIds = signal(new Set<string>());
  private downloadingExportId = signal<string | null>(null);

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
    if (this.expiredExportIds().has(notification.payload.exportId)) return true;
    return isExportExpiresAtPast(notification.payload.expiresAt);
  }

  isNotificationDisabled(notification: DisplayableNotification): boolean {
    if (isGroupResultsExportFailedNotification(notification)) return true;
    return isGroupResultsExportReadyNotification(notification) && this.isExportLinkExpired(notification);
  }

  isDownloading(notification: GroupResultsExportReadyNotification): boolean {
    return this.downloadingExportId() === notification.payload.exportId;
  }

  readySummary(notification: GroupResultsExportReadyNotification): string {
    return exportReadySummary(notification.payload.groupName, notification.payload.items);
  }

  failedSummary(groupName: string, error: string): string {
    return exportFailedSummary(groupName, error);
  }

  openThread(notification: ForumNewMessageNotification): void {
    openForumThreadFromNotification$(notification, this.getItemByIdService, this.store).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onNotificationClick(notification: DisplayableNotification): void {
    if (this.isNotificationDisabled(notification)) return;
    if (isForumNewMessageNotification(notification)) {
      this.openThread(notification);
      return;
    }
    if (isGroupResultsExportReadyNotification(notification)) {
      this.downloadExport(notification);
    }
  }

  downloadExport(notification: GroupResultsExportReadyNotification): void {
    if (this.isExportLinkExpired(notification)) return;
    if (this.downloadingExportId() !== null) return;

    const exportId = notification.payload.exportId;
    this.downloadingExportId.set(exportId);
    this.groupResultsExportService.getDownloadUrl(exportId).pipe(
      finalize(() => {
        if (this.downloadingExportId() === exportId) this.downloadingExportId.set(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: url => {
        if (!this.openDownloadUrl(url)) {
          this.messageService.add({
            severity: 'error',
            detail: $localize`Failed to download the export.`,
          });
        }
      },
      error: (err: unknown) => {
        if (errorIsHTTPNotFound(err)) {
          this.expiredExportIds.update(ids => new Set(ids).add(exportId));
          this.messageService.add({
            severity: 'error',
            detail: $localize`This download link has expired.`,
          });
          return;
        }
        this.messageService.add({
          severity: 'error',
          detail: $localize`Failed to download the export.`,
        });
      },
    });
  }

  openDownloadUrl(url: string): boolean {
    return openHttpsDownloadUrl(url);
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
