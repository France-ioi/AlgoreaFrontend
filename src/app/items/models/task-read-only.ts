import { RawItemRoute } from 'src/app/models/routing/item-route';
import { HistoryTaskLoad } from '../services/history-task-load.request';

/**
 * Whether the item task opens read-only: the route names a specific answer, or History asked to load an
 * observed participant's attempt. Single source for the task flow and for History's Show/Restore label.
 */
export function opensTaskReadOnly(route: Pick<RawItemRoute, 'answer'>, historyLoad: HistoryTaskLoad | null): boolean {
  return route.answer !== undefined || historyLoad?.observedParticipantId !== undefined;
}
