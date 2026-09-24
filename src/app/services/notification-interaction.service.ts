import { inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { GroupResultsExportService } from 'src/app/data-access/group-results-export.service';
import { NotificationHttpService } from 'src/app/data-access/notification.service';
import { openForumThreadFromNotification$ } from 'src/app/forum/utils/open-forum-thread-from-notification';
import {
  DisplayableNotification,
  GroupResultsExportReadyNotification,
  isForumNewMessageNotification,
  isGroupResultsExportFailedNotification,
  isGroupResultsExportReadyNotification,
} from 'src/app/models/notification';
import { isExportExpiresAtPast } from 'src/app/models/notification-display';
import { notificationApiActions } from 'src/app/store/notification';
import { errorIsHTTPNotFound } from 'src/app/utils/errors';
import { openHttpsDownloadUrl } from 'src/app/utils/open-https-download-url';
import { MessageService } from './message.service';

/**
 * Shared activate/clear behavior for notification toasts and the bell panel.
 * Download and delete run in parallel for ready export clicks; an in-flight export-id
 * guard prevents overlapping downloads (and must not delete a different ready export).
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationInteractionService {
  private store = inject<Store<object>>(Store);
  private messageService = inject(MessageService);
  private getItemByIdService = inject(GetItemByIdService);
  private notificationService = inject(NotificationHttpService);
  private groupResultsExportService = inject(GroupResultsExportService);

  private expiredExportIds = signal(new Set<string>());
  private downloadingExportId = signal<string | null>(null);

  isExportLinkExpired(notification: GroupResultsExportReadyNotification): boolean {
    if (this.expiredExportIds().has(notification.payload.exportId)) return true;
    return isExportExpiresAtPast(notification.payload.expiresAt);
  }

  isDownloading(notification: GroupResultsExportReadyNotification): boolean {
    return this.downloadingExportId() === notification.payload.exportId;
  }

  clear$(sk: number): Observable<void> {
    return this.notificationService.deleteNotification(sk).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => this.store.dispatch(notificationApiActions.notificationDeleted({ sk }))),
    );
  }

  activate$(notification: DisplayableNotification): Observable<void> {
    if (isForumNewMessageNotification(notification)) {
      return openForumThreadFromNotification$(notification, this.getItemByIdService, this.store);
    }
    if (isGroupResultsExportFailedNotification(notification)) {
      return this.clear$(notification.sk);
    }
    if (isGroupResultsExportReadyNotification(notification)) {
      if (this.isExportLinkExpired(notification)) {
        return this.clear$(notification.sk);
      }
      // Global single-flight: if another download is in progress, do not start a second
      // download and do not delete this notification (user can retry after the first finishes).
      if (this.downloadingExportId() !== null) {
        return of(undefined);
      }
      // Consume-on-click: delete in parallel with download even if open/getDownloadUrl later
      // fails — the toast/row click is the consume gesture (same as failed/expired → delete).
      return forkJoin([
        this.downloadExport$(notification),
        this.clear$(notification.sk),
      ]).pipe(map(() => undefined));
    }
    const exhaustiveCheck: never = notification;
    return exhaustiveCheck;
  }

  private downloadExport$(notification: GroupResultsExportReadyNotification): Observable<void> {
    const exportId = notification.payload.exportId;
    this.downloadingExportId.set(exportId);
    return this.groupResultsExportService.getDownloadUrl(exportId).pipe(
      tap(url => {
        if (!openHttpsDownloadUrl(url)) {
          this.messageService.add({
            severity: 'error',
            detail: $localize`Failed to download the export.`,
          });
        }
      }),
      map(() => undefined),
      catchError((err: unknown) => {
        if (errorIsHTTPNotFound(err)) {
          this.expiredExportIds.update(ids => new Set(ids).add(exportId));
          this.messageService.add({
            severity: 'error',
            detail: $localize`This download link has expired.`,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            detail: $localize`Failed to download the export.`,
          });
        }
        return of(undefined);
      }),
      finalize(() => {
        if (this.downloadingExportId() === exportId) this.downloadingExportId.set(null);
      }),
    );
  }
}
