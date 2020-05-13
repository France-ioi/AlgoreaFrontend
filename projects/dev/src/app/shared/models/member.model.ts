import { User } from './user.model';

export interface Member {
    action: string;
    id: string;
    member_since: Date;
    user: User;
}
