import { FetchState } from 'src/app/utils/state';
import { RawGroupRoute } from 'src/app/models/routing/group-route';

export interface GroupInfo { name: string, currentUserCanGrantAccess: boolean }

export interface State {
  group: {
    route: RawGroupRoute,
    info: FetchState<GroupInfo>,
  } | null,
}

export const initialState: State = {
  group: null,
};
