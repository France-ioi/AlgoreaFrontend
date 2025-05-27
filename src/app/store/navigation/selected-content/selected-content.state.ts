import { GroupPage, myGroupsPage, RawGroupRoute } from 'src/app/models/routing/group-route';
import { ItemRoute } from 'src/app/models/routing/item-route';


export interface State {
  activity: ItemRoute | null,
  skill: ItemRoute | undefined | null,
  group: RawGroupRoute | GroupPage,
}

export const initialState: State = {
  activity: null, // Will be set by an effect
  skill: null, // Will be set by an effect
  group: myGroupsPage,
};
