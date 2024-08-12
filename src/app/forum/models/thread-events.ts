import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';

export enum EventLabel {
  AttemptStarted = 'result_started',
  Submission = 'submission',
  Message = 'message',
}

/**
 * Decoders
 */

const attemptStartedEventDecoder = D.struct({
  label: D.literal(EventLabel.AttemptStarted),
  data: D.struct({
    attemptId: D.string,
  }),
});

const submissionEventDecoder = D.struct({
  label: D.literal(EventLabel.Submission),
  data: pipe(
    D.struct({
      attemptId: D.string,
      answerId: D.string,
    }),
    D.intersect(D.partial({
      score: D.number,
    })),
  )
});

const messageEventDecoder = D.struct({
  label: D.literal(EventLabel.Message),
  data: D.struct({
    content: D.string,
  }),
});

export const threadEventDecoder = D.union(
  attemptStartedEventDecoder,
  submissionEventDecoder,
  messageEventDecoder,
);

/**
 * Event types
 */

export type AttemptStartedEvent = D.TypeOf<typeof attemptStartedEventDecoder>;
export type SubmissionEvent = D.TypeOf<typeof submissionEventDecoder>;
export type MessageEvent = D.TypeOf<typeof messageEventDecoder>;

export type ThreadEvent = D.TypeOf<typeof threadEventDecoder>;

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
