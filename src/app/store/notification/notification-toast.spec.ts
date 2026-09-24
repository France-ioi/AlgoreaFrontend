import {
  ForumNewMessageNotification,
  GroupResultsExportFailedNotification,
  GroupResultsExportReadyNotification,
  Notification,
} from 'src/app/models/notification';
import { toastMessageForNotification } from './notification-toast';

describe('toastMessageForNotification', () => {
  it('maps forum messages to an info toast', () => {
    const notification: ForumNewMessageNotification = {
      sk: 1,
      notificationType: 'forum.new_message',
      payload: {
        participantId: 'p1',
        itemId: 'i1',
        time: 1000,
        text: 'Hello',
        authorId: 'a1',
        uuid: 'u1',
      },
    };

    expect(toastMessageForNotification(notification)).toEqual({
      severity: 'info',
      summary: 'New message',
      detail: 'Hello',
    });
  });

  it('maps export-ready notifications to a success toast', () => {
    const notification: GroupResultsExportReadyNotification = {
      sk: 2,
      notificationType: 'group_results_export.ready',
      payload: {
        exportId: 'exp-1',
        groupId: 'g1',
        groupName: 'Class A',
        items: [ { id: 'i1', title: 'Chapter 1' } ],
        filename: 'export.zip',
        sizeBytes: 1024,
        expiresAt: 1893456000000,
      },
    };

    const toast = toastMessageForNotification(notification);
    expect(toast?.severity).toBe('success');
    expect(toast?.summary).toBe('Export ready');
    expect(toast?.detail).toContain('Class A');
    expect(toast?.detail).toContain('Chapter 1');
  });

  it('maps export-failed notifications to an error toast', () => {
    const notification: GroupResultsExportFailedNotification = {
      sk: 3,
      notificationType: 'group_results_export.failed',
      payload: {
        exportId: 'exp-2',
        groupId: 'g1',
        groupName: 'Class A',
        items: [],
        error: 'too_many_entries',
      },
    };

    const toast = toastMessageForNotification(notification);
    expect(toast?.severity).toBe('error');
    expect(toast?.summary).toBe('Export failed');
    expect(toast?.detail).toContain('Class A');
  });

  it('returns undefined for unknown notification types', () => {
    const notification: Notification = {
      sk: 4,
      notificationType: 'something.unknown',
      payload: { foo: 'bar' },
    };
    expect(toastMessageForNotification(notification)).toBeUndefined();
  });
});
