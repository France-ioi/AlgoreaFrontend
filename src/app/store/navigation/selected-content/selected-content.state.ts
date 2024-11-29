import { GroupPage, myGroupsPage, RawGroupRoute } from 'src/app/models/routing/group-route';
import { appDefaultActivityRoute, appDefaultSkillRoute, ItemRoute } from 'src/app/models/routing/item-route';

export interface State {
  activity: ItemRoute,
  skill: ItemRoute|undefined,
  group: RawGroupRoute|GroupPage,
}

export const initialState: State = {
  activity: appDefaultActivityRoute,
  skill: appDefaultSkillRoute,
  group: myGroupsPage,
};
