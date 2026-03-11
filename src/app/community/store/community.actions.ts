import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const communityPollActions = createActionGroup({
  source: 'Community Poll',
  events: {
    pollResultReceived: props<{ hasNew: boolean }>(),
  },
});

export const communityPageActions = createActionGroup({
  source: 'Community Page',
  events: {
    pageVisited: emptyProps(),
  },
});

export const communityActivityFeedActions = createActionGroup({
  source: 'Community Activity Feed',
  events: {
    opened: emptyProps(),
    closed: emptyProps(),
  },
});
