import * as itemContentStore from './item-content/item-content.state';
import * as answerBackLinkStore from './answer-back-link/answer-back-link.state';

export const featureName = 'items';

export interface State {
  itemContent: itemContentStore.State,
  answerBackLink: answerBackLinkStore.State,
}

export const initialState: State = {
  itemContent: itemContentStore.initialState,
  answerBackLink: answerBackLinkStore.initialState,
};
