
export interface UserInfo {
  id: string,
  isCurrentUser: boolean,
  isThreadParticipant: boolean,
  notVisibleUser: boolean,
  name?: string,
}
