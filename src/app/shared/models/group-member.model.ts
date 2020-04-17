import { User } from './user.model';

export interface GroupMember {
    action: string;
    id: string;
    member_since: Date;
    user: User;
}