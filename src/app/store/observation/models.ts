import { RawGroupRoute } from 'src/app/models/routing/group-route';

export interface ObservationInfo {
  route: RawGroupRoute,
  name: string,
  currentUserCanGrantAccess: boolean,
  currentUserWatchGroup: boolean,
}
