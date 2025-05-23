import { Aliases } from 'src/app/models/routing/item-route-aliasing';

export interface State {
  redirects: Aliases,
}

export const initialState: State = {
  redirects: {},
};

