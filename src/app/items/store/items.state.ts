import * as itemContentStore from './item-content/item-content.state';
import * as backLinkStore from './back-link/back-link.state';

export const featureName = 'items';

export interface State {
  itemContent: itemContentStore.State,
  backLink: backLinkStore.State,
}

export const initialState: State = {
  itemContent: itemContentStore.initialState,
  backLink: backLinkStore.initialState,
};
