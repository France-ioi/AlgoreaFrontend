import {
  isDisplayableNotification,
  isForumNewMessageNotification,
  isGroupResultsExportFailedNotification,
  isGroupResultsExportReadyNotification,
  notificationSchema,
} from './notification';

describe('notificationSchema', () => {
  it('parses forum.new_message notifications', () => {
    const result = notificationSchema.safeParse({
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
    });

    expect(result.success).toBeTrue();
    if (result.success) {
      expect(isForumNewMessageNotification(result.data)).toBeTrue();
    }
  });

  it('parses group_results_export.ready notifications', () => {
    const result = notificationSchema.safeParse({
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
    });

    expect(result.success).toBeTrue();
    if (result.success) {
      expect(isGroupResultsExportReadyNotification(result.data)).toBeTrue();
      expect(isDisplayableNotification(result.data)).toBeTrue();
    }
  });

  it('parses group_results_export.failed notifications', () => {
    const result = notificationSchema.safeParse({
      sk: 3,
      notificationType: 'group_results_export.failed',
      payload: {
        exportId: 'exp-2',
        groupId: 'g1',
        groupName: 'Class A',
        items: [ { id: 'i1', title: 'Chapter 1' } ],
        error: 'Timeout',
      },
    });

    expect(result.success).toBeTrue();
    if (result.success) {
      expect(isGroupResultsExportFailedNotification(result.data)).toBeTrue();
    }
  });

  it('falls back to generic for unknown notification types', () => {
    const result = notificationSchema.safeParse({
      sk: 4,
      notificationType: 'something.unknown',
      payload: { foo: 'bar' },
    });

    expect(result.success).toBeTrue();
    if (result.success) {
      expect(result.data.notificationType).toBe('something.unknown');
      expect(isDisplayableNotification(result.data)).toBeFalse();
    }
  });

  it('rejects typed notification types with invalid payloads as generic mismatch', () => {
    const result = notificationSchema.safeParse({
      sk: 5,
      notificationType: 'group_results_export.ready',
      payload: { incomplete: true },
    });

    expect(result.success).toBeFalse();
  });
});
