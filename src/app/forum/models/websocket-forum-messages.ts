import { z } from 'zod';

export enum ForumMessageAction {
  NewMessage = 'forum.message.new',
}

/**
 * WS Forum Message schemas
 */

export const userMessageForumWsMessageSchema = z.object({
  action: z.literal(ForumMessageAction.NewMessage),
  participantId: z.string(),
  itemId: z.string(),
  authorId: z.string(),
  time: z.number().transform(val => new Date(val)),
  text: z.string(),
  uuid: z.string(),
});

export const forumWsMessageSchema = z.discriminatedUnion('action', [
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
  return message.action === ForumMessageAction.NewMessage;
}
