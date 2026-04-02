import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FetchState } from 'src/app/utils/state';
import { CommunityStats } from '../data-access/get-community-stats.service';

export const communityPollActions = createActionGroup({
  source: 'Community Poll',
  events: {
    pollResultReceived: props<{ hasNew: boolean }>(),
  },
});

export const communityActivityFeedActions = createActionGroup({
  source: 'Community Activity Feed',
  events: {
    opened: emptyProps(),
    closed: emptyProps(),
  },
});

export const communityStatsApiActions = createActionGroup({
  source: 'Community Stats API',
  events: {
    fetchStateChanged: props<{ fetchState: FetchState<CommunityStats> }>(),
  },
});
