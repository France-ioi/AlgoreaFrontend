import { ActivityLogs } from 'src/app/data-access/activity-log.service';
import { ThreadEvent, attemptStartedEvent, messageEvent, submissionEvent } from './thread-events';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { ThreadMessage } from 'src/app/data-access/thread-message.service';

export function convertActivityLogsToThreadEvents(events: ActivityLogs): ThreadEvent[] {
  return events.map(event => {
    switch (event.activityType) {
      case 'result_started': {
        const { attemptId, at } = event;
        return { ...attemptStartedEvent({ attemptId }), time: at.valueOf() };
      }
      case 'submission': {
        const { attemptId, answerId, at, score } = event;
        if (!answerId) return null;
        return { ...submissionEvent({ attemptId, answerId, score }), time: at.valueOf() };
      }
      default: return null;
    }
  }).filter(isNotNull);
}

export function convertThreadMessageToThreadEvents(msgs: ThreadMessage[]): ThreadEvent[] {
  return msgs.map(msg => messageEvent(msg.message));
}
