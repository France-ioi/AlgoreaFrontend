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

const genericNotificationSchema = baseNotificationSchema.extend({
  notificationType: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

// Union type that tries forum.new_message first, falls back to generic
export const notificationSchema = z.union([
  forumNewMessageNotificationSchema,
  genericNotificationSchema,
]);

export type ForumNewMessageNotification = z.infer<typeof forumNewMessageNotificationSchema>;
export type GenericNotification = z.infer<typeof genericNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;

export function isForumNewMessageNotification(n: Notification): n is ForumNewMessageNotification {
  return n.notificationType === 'forum.new_message';
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
