import { FetchState, fetchingState } from 'src/app/utils/state';
import { CommunityStats } from '../data-access/get-community-stats.service';

export interface State {
  hasUnreadThreads: boolean,
  activityFeedActive: boolean,
  statsState: FetchState<CommunityStats>,
}

export const initialState: State = {
  hasUnreadThreads: false,
  activityFeedActive: false,
  statsState: fetchingState(),
};
