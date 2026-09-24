import { z } from 'zod';

// Payload schemas for specific notification types
const forumNewMessagePayloadSchema = z.object({
  participantId: z.string(),
  itemId: z.string(),
  time: z.number(),
  text: z.string(),
  authorId: z.string(),
  uuid: z.string(),
});

export type ForumNewMessagePayload = z.infer<typeof forumNewMessagePayloadSchema>;

const groupResultsExportItemSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const groupResultsExportReadyPayloadSchema = z.object({
  exportId: z.string(),
  groupId: z.string(),
  groupName: z.string(),
  items: z.array(groupResultsExportItemSchema),
  filename: z.string(),
  sizeBytes: z.number(),
  expiresAt: z.number(), // Unix milliseconds (API contract)
});

export type GroupResultsExportReadyPayload = z.infer<typeof groupResultsExportReadyPayloadSchema>;

const groupResultsExportFailedPayloadSchema = z.object({
  exportId: z.string(),
  groupId: z.string(),
  groupName: z.string(),
  items: z.array(groupResultsExportItemSchema),
  error: z.string(),
});

export type GroupResultsExportFailedPayload = z.infer<typeof groupResultsExportFailedPayloadSchema>;

// Base notification schema
const baseNotificationSchema = z.object({
  sk: z.number(),
  readTime: z.number().optional(),
});

// Discriminated union for typed notifications
const forumNewMessageNotificationSchema = baseNotificationSchema.extend({
  notificationType: z.literal('forum.new_message'),
  payload: forumNewMessagePayloadSchema,
});

const groupResultsExportReadyNotificationSchema = baseNotificationSchema.extend({
  notificationType: z.literal('group_results_export.ready'),
  payload: groupResultsExportReadyPayloadSchema,
});

const groupResultsExportFailedNotificationSchema = baseNotificationSchema.extend({
  notificationType: z.literal('group_results_export.failed'),
  payload: groupResultsExportFailedPayloadSchema,
});

const typedNotificationTypes = [
  'forum.new_message',
  'group_results_export.ready',
  'group_results_export.failed',
] as const;

const genericNotificationSchema = baseNotificationSchema.extend({
  notificationType: z.string().refine(t => !(typedNotificationTypes as readonly string[]).includes(t)),
  payload: z.record(z.string(), z.unknown()),
});

// Union type that tries typed notifications first, falls back to generic
export const notificationSchema = z.union([
  forumNewMessageNotificationSchema,
  groupResultsExportReadyNotificationSchema,
  groupResultsExportFailedNotificationSchema,
  genericNotificationSchema,
]);

export type ForumNewMessageNotification = z.infer<typeof forumNewMessageNotificationSchema>;
export type GroupResultsExportReadyNotification = z.infer<typeof groupResultsExportReadyNotificationSchema>;
export type GroupResultsExportFailedNotification = z.infer<typeof groupResultsExportFailedNotificationSchema>;
export type GenericNotification = z.infer<typeof genericNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;

export function isForumNewMessageNotification(n: Notification): n is ForumNewMessageNotification {
  return n.notificationType === 'forum.new_message';
}

export function isGroupResultsExportReadyNotification(n: Notification): n is GroupResultsExportReadyNotification {
  return n.notificationType === 'group_results_export.ready';
}

export function isGroupResultsExportFailedNotification(n: Notification): n is GroupResultsExportFailedNotification {
  return n.notificationType === 'group_results_export.failed';
}

export type DisplayableNotification =
  | ForumNewMessageNotification
  | GroupResultsExportReadyNotification
  | GroupResultsExportFailedNotification;

export function isDisplayableNotification(n: Notification): n is DisplayableNotification {
  return isForumNewMessageNotification(n)
    || isGroupResultsExportReadyNotification(n)
    || isGroupResultsExportFailedNotification(n);
}

// WebSocket notification message schema
export const notificationWsMessageSchema = z.object({
  action: z.literal('notification.new'),
  notification: notificationSchema,
});

export type NotificationWsMessage = z.infer<typeof notificationWsMessageSchema>;

export function isNotificationWsMessage(msg: { action: string }): boolean {
  return msg.action === 'notification.new';
}
