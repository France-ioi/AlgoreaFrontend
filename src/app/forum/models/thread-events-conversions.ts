import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { ThreadEvent, attemptStartedEvent, messageEvent, MessageEvent, submissionEvent } from './thread-events';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { ThreadMessage } from 'src/app/data-access/thread-message.service';
import { UserMessageForumWsMessage } from './websocket-forum-messages';

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
  const { authorId, time, text } = msgs;
  return messageEvent({ authorId, time, text });
}
