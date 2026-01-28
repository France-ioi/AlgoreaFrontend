import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { ThreadEvent, attemptStartedEvent, messageEvent, MessageEvent, SubmissionEvent, submissionEvent } from './thread-events';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { ThreadMessage } from 'src/app/data-access/thread-message.service';
import { GradeUpdateForumWsMessage, NewSubmissionForumWsMessage, UserMessageForumWsMessage } from './websocket-forum-messages';

export function convertActivityLogsToThreadEvents(events: ActivityLogs): ThreadEvent[] {
  return events.map(event => {
    switch (event.activityType) {
      case 'result_started': {
        const { attemptId, at } = event;
        return attemptStartedEvent({ attemptId, time: at });
      }
      case 'submission': {
        const { attemptId, answerId, at, score } = event;
        if (!answerId) return null;
        return submissionEvent({ attemptId, answerId, score, time: at });
      }
      default: return null;
    }
  }).filter(isNotNull);
}

export function convertThreadMessageToThreadEvents(msgs: ThreadMessage[]): MessageEvent[] {
  return msgs.map(msg => messageEvent(msg));
}

export function convertWsMessageToMessageEvent(msgs: UserMessageForumWsMessage): MessageEvent {
  const { authorId, time, text, uuid } = msgs;
  return messageEvent({ authorId, time, text, uuid });
}

export function convertNewSubmissionWsMessageToSubmissionEvent(msg: NewSubmissionForumWsMessage): SubmissionEvent {
  const { answerId, attemptId, time } = msg;
  return submissionEvent({ answerId, attemptId, time });
}

export function convertGradeUpdateWsMessageToSubmissionEvent(msg: GradeUpdateForumWsMessage): SubmissionEvent {
  const { answerId, attemptId, time, score } = msg;
  return submissionEvent({ answerId, attemptId, time, score });
}

/**
 * Merge a new submission event into an existing list of events.
 * If a submission with the same answerId exists, merge them (keep score if present, use min time).
 * Otherwise, add the new event to the list.
 */
export function mergeSubmissionEvent(events: ThreadEvent[], newEvent: SubmissionEvent): ThreadEvent[] {
  const existingIndex = events.findIndex(
    e => e.kind === newEvent.kind && e.answerId === newEvent.answerId
  );

  if (existingIndex === -1) {
    return [ ...events, newEvent ];
  }

  const existing = events[existingIndex] as SubmissionEvent;
  const merged: SubmissionEvent = {
    ...existing,
    time: existing.time < newEvent.time ? existing.time : newEvent.time,
    score: newEvent.score ?? existing.score,
  };

  return [ ...events.slice(0, existingIndex), merged, ...events.slice(existingIndex + 1) ];
}
