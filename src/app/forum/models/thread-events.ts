import { Pipe, PipeTransform } from '@angular/core';

export enum EventKind {
  AttemptStarted = 'result_started',
  Submission = 'submission',
  Message = 'message',
}

/**
 * Event types
 */

export interface AttemptStartedEvent {
  kind: EventKind.AttemptStarted,
  time: Date,
  attemptId: string,
}

export interface SubmissionEvent {
  kind: EventKind.Submission,
  time: Date,
  attemptId: string,
  answerId: string,
  score?: number,
}

export interface MessageEvent {
  kind: EventKind.Message,
  time: Date,
  authorId: string,
  text: string,
  uuid: string,
}

export type ThreadEvent = AttemptStartedEvent | SubmissionEvent | MessageEvent;

/**
 * Event factories
 */

export function messageEvent(data: Omit<MessageEvent, 'kind'>): MessageEvent {
  return { kind: EventKind.Message, ...data };
}
export function attemptStartedEvent(data: Omit<AttemptStartedEvent, 'kind'>): AttemptStartedEvent {
  return { kind: EventKind.AttemptStarted, ...data };
}
export function submissionEvent(data: Omit<SubmissionEvent, 'kind'>): SubmissionEvent {
  return { kind: EventKind.Submission, ...data };
}


/**
 * Event type assertions
 */

export function isMessageEvent(event: ThreadEvent): event is MessageEvent {
  return event.kind === EventKind.Message;
}

export function isAttemptStartedEvent(event: ThreadEvent): event is AttemptStartedEvent {
  return event.kind === EventKind.AttemptStarted;
}

export function isSubmissionEvent(event: ThreadEvent): event is SubmissionEvent {
  return event.kind === EventKind.Submission;
}

/**
 * Merge multiple event lists into a single list, sorted by time.
 */
export function mergeEvents(eventLists: ThreadEvent[][]): ThreadEvent[] {
  return eventLists
    .flat()
    .sort((a, b) => a.time.valueOf() - b.time.valueOf()) // sort by date ascending
    .filter((el, i, list) => el.kind !== list[i-1]?.kind || el.time.valueOf() !== list[i-1]?.time.valueOf()); // remove duplicate
}


/**
 * Pipes for type assertion
 */
@Pipe({ name: 'isMessageEvent', pure: true, standalone: true })
export class IsMessageEventPipe implements PipeTransform {
  transform = isMessageEvent;
}
@Pipe({ name: 'isAttemptStartedEvent', pure: true, standalone: true })
export class IsAttemptStartedEventPipe implements PipeTransform {
  transform = isAttemptStartedEvent;
}
@Pipe({ name: 'isSubmissionEvent', pure: true, standalone: true })
export class IsSubmissionEventPipe implements PipeTransform {
  transform = isSubmissionEvent;
}
