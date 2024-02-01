import { FetchState } from 'src/app/utils/state';
import { User } from '../../models/user';

export interface GroupInfo { name: string, currentUserCanGrantAccess: boolean }

export interface State {
  user: FetchState<User> | null,
}

export const initialState: State = {
  user: null,
};
