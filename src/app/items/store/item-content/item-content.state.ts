import { FetchError, FetchState, Fetching, fetchingState } from 'src/app/utils/state';
import { BreadcrumbItem } from '../../data-access/get-breadcrumb.service';
import { Item as ItemFromService } from 'src/app/data-access/get-item-by-id.service';
import { Result } from '../../models/attempts';
import { FullItemRoute } from 'src/app/models/routing/item-route';

export type Item = ItemFromService;
export type Breadcumbs = BreadcrumbItem[];
export interface Results { results: Result[], currentResult?: Result }


export interface State {
  /**
   * If there is a route error: whether it is currently fetching more info or there was an error while handling the error``
   * Otherwise, the value is irrelevant.
   */
  routeErrorHandling: Fetching<undefined>|FetchError,

  itemState: FetchState<Item, Pick<FullItemRoute, 'id' | 'observedGroup'>>,
  breadcrumbsState: FetchState<Breadcumbs, FullItemRoute>,
  /** `results` of the current participant on the active item */
  resultsState: FetchState<Results, FullItemRoute>,
}

export const initialState: State = {
  routeErrorHandling: fetchingState(),
  itemState: fetchingState(),
  breadcrumbsState: fetchingState(),
  resultsState: fetchingState(),
};
