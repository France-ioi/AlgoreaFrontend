export interface State {
  hasUnreadThreads: boolean,
  activityFeedActive: boolean,
}

export const initialState: State = {
  hasUnreadThreads: false,
  activityFeedActive: false,
};
