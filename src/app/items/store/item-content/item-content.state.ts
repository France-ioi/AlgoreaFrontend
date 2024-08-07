import { FetchError, FetchState, Fetching, fetchingState } from 'src/app/utils/state';
import { BreadcrumbItem } from '../../data-access/get-breadcrumb.service';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { Result } from '../../data-access/get-results.service';
import { FullItemRoute } from 'src/app/models/routing/item-route';

type ItemId = string;

export interface State {
  /**
   * If there is a route error: whether it is currently fetching more info or there was an error while handling the error``
   * Otherwise, the value is irrelevant.
   */
  routeErrorHandling: Fetching<undefined>|FetchError,

  item: FetchState<Item, { id: ItemId, observedGroupId: string|null }>,
  breadcrumbs: FetchState<BreadcrumbItem[], FullItemRoute>,
  /** `results` of the current participant on the active item */
  results: FetchState<{ results: Result[], currentResult?: Result }, FullItemRoute>|null,
}

export const initialState: State = {
  routeErrorHandling: fetchingState(),
  item: fetchingState(),
  breadcrumbs: fetchingState(),
  results: null,
};
