import {
  DisplayableNotification,
  isDisplayableNotification,
  Notification,
} from 'src/app/models/notification';
import {
  exportFailedSummary,
  exportReadySummary,
} from 'src/app/models/notification-display';
import { MessageV2 } from 'src/app/services/message.service';

/**
 * Default toast content for a notification. Returns undefined for unknown types
 * (they stay in the store but are not surfaced as toasts).
 * Displayable types are mapped exhaustively so a new type is a compile error until handled.
 */
export function toastMessageForNotification(notification: Notification): MessageV2 | undefined {
  if (!isDisplayableNotification(notification)) return undefined;
  return toastMessageForDisplayableNotification(notification);
}

function toastMessageForDisplayableNotification(notification: DisplayableNotification): MessageV2 {
  switch (notification.notificationType) {
    case 'forum.new_message':
      return {
        severity: 'info',
        summary: $localize`New message`,
        detail: notification.payload.text,
      };
    case 'group_results_export.ready':
      return {
        severity: 'success',
        summary: $localize`Export ready`,
        detail: exportReadySummary(notification.payload.groupName, notification.payload.items),
      };
    case 'group_results_export.failed':
      return {
        severity: 'error',
        summary: $localize`Export failed`,
        detail: exportFailedSummary(notification.payload.groupName, notification.payload.error),
      };
    default: {
      const exhaustiveCheck: never = notification;
      return exhaustiveCheck;
    }
  }
}
