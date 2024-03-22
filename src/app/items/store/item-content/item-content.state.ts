import { FetchError, Fetching, fetchingState } from 'src/app/utils/state';

export interface State {
  /**
   * If there is a route error: whether it is currently fetching more info or there was an error while handling the error``
   * Otherwise, the value is irrelevant.
   */
  routeErrorHandling: Fetching<undefined>|FetchError,
}

export const initialState: State = {
  routeErrorHandling: fetchingState(),
};
