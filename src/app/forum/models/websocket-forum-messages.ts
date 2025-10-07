import { z } from 'zod';

enum MessageLabel {
  Message = 'forum.message',
}

/**
 * Payload schemas
 */

const userMessageSchema = z.object({
  participantId: z.string(),
  itemId: z.string(),
  authorId: z.string(),
  time: z.date(),
  text: z.string(),
});

/**
 * WS Forum Message schemas
 */

export const userMessageForumWsMessageSchema = z.object({
  label: z.literal(MessageLabel.Message),
  data: userMessageSchema,
});

export const forumWsMessageSchema = z.discriminatedUnion('label', [
  userMessageForumWsMessageSchema,
]);

/**
 * Event types
 */

export type UserMessageForumWsMessage = z.infer<typeof userMessageForumWsMessageSchema>;
export type ForumWsMessage = z.infer<typeof forumWsMessageSchema>;

/**
 * Event type assertions
 */
export function isUserMessageForumWsMessage(message: ForumWsMessage): message is UserMessageForumWsMessage {
  return message.label === MessageLabel.Message;
}
