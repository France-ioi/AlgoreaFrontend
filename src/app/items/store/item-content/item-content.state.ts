import { FetchError, Fetching, fetchingState } from 'src/app/utils/state';

export interface State {
  /**
   * If there is a route error: whether it is currently fetching more info or there was an error while handling the error``
   * Otherwise, the value is irrelevant.
   */
  routeErrorHandling: Fetching<undefined>|FetchError,

  /**
   * If the item route has `answer.fromStore` set when loading a task, this answer is loaded into the task.
   * It is a mechanism to load an answer by value (without knowing or having a access to the id)
   */
  answer: string,
}

export const initialState: State = {
  routeErrorHandling: fetchingState(),
  answer: '',
};
