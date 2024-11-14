import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { appDefaultActivityRoute, appDefaultSkillRoute, ItemRoute } from 'src/app/models/routing/item-route';

export const myGroupsPage = 'mine';
export const managedGroupsPage = 'managed';

export interface State {
  activity: ItemRoute,
  skill?: ItemRoute,
  group: RawGroupRoute|typeof myGroupsPage|typeof managedGroupsPage,
}

export const initialState: State = {
  activity: appDefaultActivityRoute,
  skill: appDefaultSkillRoute,
  group: myGroupsPage,
};
