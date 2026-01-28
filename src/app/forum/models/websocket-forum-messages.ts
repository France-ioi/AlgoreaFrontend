import { z } from 'zod';

export enum ForumMessageAction {
  NewMessage = 'forum.message.new',
  NewSubmission = 'forum.submission.new',
  GradeUpdate = 'forum.grade.update',
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

export const newSubmissionForumWsMessageSchema = z.object({
  action: z.literal(ForumMessageAction.NewSubmission),
  participantId: z.string(),
  itemId: z.string(),
  attemptId: z.string(),
  answerId: z.string(),
  time: z.number().transform(val => new Date(val)),
  authorId: z.string(),
});

export const gradeUpdateForumWsMessageSchema = z.object({
  action: z.literal(ForumMessageAction.GradeUpdate),
  participantId: z.string(),
  itemId: z.string(),
  attemptId: z.string(),
  answerId: z.string(),
  time: z.number().transform(val => new Date(val)),
  score: z.number(),
  validated: z.boolean(),
});

export const forumWsMessageSchema = z.discriminatedUnion('action', [
  userMessageForumWsMessageSchema,
  newSubmissionForumWsMessageSchema,
  gradeUpdateForumWsMessageSchema,
]);

/**
 * Event types
 */

export type UserMessageForumWsMessage = z.infer<typeof userMessageForumWsMessageSchema>;
export type NewSubmissionForumWsMessage = z.infer<typeof newSubmissionForumWsMessageSchema>;
export type GradeUpdateForumWsMessage = z.infer<typeof gradeUpdateForumWsMessageSchema>;
export type ForumWsMessage = z.infer<typeof forumWsMessageSchema>;

/**
 * Event type assertions
 */
export function isUserMessageForumWsMessage(message: ForumWsMessage): message is UserMessageForumWsMessage {
  return message.action === ForumMessageAction.NewMessage;
}

export function isNewSubmissionForumWsMessage(message: ForumWsMessage): message is NewSubmissionForumWsMessage {
  return message.action === ForumMessageAction.NewSubmission;
}

export function isGradeUpdateForumWsMessage(message: ForumWsMessage): message is GradeUpdateForumWsMessage {
  return message.action === ForumMessageAction.GradeUpdate;
}
