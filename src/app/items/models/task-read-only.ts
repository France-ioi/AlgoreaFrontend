import { RawItemRoute } from 'src/app/models/routing/item-route';
import { HistoryTaskLoad } from '../services/history-task-load.request';

/**
 * Whether the item task opens read-only: the route names a specific answer, History asked to load an
 * observed participant's attempt, or the current attempt no longer accepts submissions (`areSubmissionsClosed`).
 * Single source for the task flow and for History's Show/Restore label.
 * `submissionsClosed` is a boolean (not the result) so callers snapshot the clock once per emission.
 */
export function opensTaskReadOnly(
  route: Pick<RawItemRoute, 'answer'>,
  historyLoad: HistoryTaskLoad | null,
  submissionsClosed: boolean,
): boolean {
  return route.answer !== undefined || historyLoad?.observedParticipantId !== undefined || submissionsClosed;
}
