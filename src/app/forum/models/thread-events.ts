import { z } from 'zod';

export enum EventLabel {
  AttemptStarted = 'result_started',
  Submission = 'submission',
  Message = 'message',
}

/**
 * Schemas
 */

const attemptStartedEventSchema = z.object({
  label: z.literal(EventLabel.AttemptStarted),
  data: z.object({
    attemptId: z.string(),
  }),
});

const submissionEventSchema = z.object({
  label: z.literal(EventLabel.Submission),
  data: z.object({
    attemptId: z.string(),
    answerId: z.string(),
    score: z.number().optional()
  }),
});

const messageEventSchema = z.object({
  label: z.literal(EventLabel.Message),
  data: z.object({
    content: z.string(),
  }),
});

export const threadEventSchema = z.discriminatedUnion('label', [
  attemptStartedEventSchema,
  submissionEventSchema,
  messageEventSchema,
]);

/**
 * Event types
 */

export type AttemptStartedEvent = z.infer<typeof attemptStartedEventSchema>;
export type SubmissionEvent = z.infer<typeof submissionEventSchema>;
export type MessageEvent = z.infer<typeof messageEventSchema>;

export type ThreadEvent = z.infer<typeof threadEventSchema>;

/**
 * Event factories
 */

export function messageEvent(message: string): ThreadEvent {
  return { label: EventLabel.Message, data: { content: message } };
}
export function attemptStartedEvent(data: AttemptStartedEvent['data']): AttemptStartedEvent {
  return { label: EventLabel.AttemptStarted, data };
}
export function submissionEvent(data: SubmissionEvent['data']): SubmissionEvent {
  return { label: EventLabel.Submission, data };
}


/**
 * Event type assertions
 */

export function isAttemptStartedEvent(event: ThreadEvent): event is AttemptStartedEvent {
  return event.label === EventLabel.AttemptStarted;
}

export function isSubmissionEvent(event: ThreadEvent): event is SubmissionEvent {
  return event.label === EventLabel.Submission;
}
